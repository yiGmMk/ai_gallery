import { BOARD, PHYSICS } from './constants';
import { computeShot } from './rules';

let rapierPromise;

export function loadRapier() {
  if (!rapierPromise) {
    rapierPromise = import('@dimforge/rapier2d-compat')
      .then(async module => {
        const RAPIER = module.default ?? module;
        await RAPIER.init();
        return RAPIER;
      })
      .catch(error => {
        rapierPromise = null;
        throw error;
      });
  }
  return rapierPromise;
}

function addWall(world, RAPIER, colliderMeta, descriptor) {
  const collider = world.createCollider(
    descriptor.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
  );
  colliderMeta.set(collider.handle, { kind: 'wall' });
}

function addWalls(world, RAPIER, colliderMeta, scale) {
  const halfWidth = (BOARD.width / 2) * scale;
  const halfHeight = (BOARD.height / 2) * scale;
  const wall = BOARD.wall * scale;
  const dividerHalf = (BOARD.dividerThickness / 2) * scale;
  const gapHalf = (BOARD.gapWidth / 2) * scale;
  const capRadius = BOARD.dividerCapRadius * scale;

  // Outer frame. End walls overhang the corners so no seam lets a puck out.
  addWall(world, RAPIER, colliderMeta,
    RAPIER.ColliderDesc.cuboid(wall / 2, halfHeight + wall).setTranslation(-(halfWidth + wall / 2), 0));
  addWall(world, RAPIER, colliderMeta,
    RAPIER.ColliderDesc.cuboid(wall / 2, halfHeight + wall).setTranslation(halfWidth + wall / 2, 0));
  addWall(world, RAPIER, colliderMeta,
    RAPIER.ColliderDesc.cuboid(halfWidth + wall, wall / 2).setTranslation(0, halfHeight + wall / 2));
  addWall(world, RAPIER, colliderMeta,
    RAPIER.ColliderDesc.cuboid(halfWidth + wall, wall / 2).setTranslation(0, -(halfHeight + wall / 2)));

  // Divider with a centered gap: two segments plus rounded caps leave a
  // gapWidth - 2 * dividerCapRadius opening at x = 0.
  const segmentLength = halfWidth - gapHalf;
  for (const sign of [-1, 1]) {
    addWall(world, RAPIER, colliderMeta,
      RAPIER.ColliderDesc.cuboid(segmentLength / 2, dividerHalf)
        .setTranslation(sign * (gapHalf + segmentLength / 2), 0));
    addWall(world, RAPIER, colliderMeta,
      RAPIER.ColliderDesc.ball(capRadius).setTranslation(sign * gapHalf, 0));
  }
}

export function createWorld(RAPIER, pucks) {
  const scale = PHYSICS.worldScale;
  const world = new RAPIER.World({ x: 0, y: 0 });
  world.timestep = PHYSICS.fixedDt;
  const colliderMeta = new Map();
  const bodies = [];

  addWalls(world, RAPIER, colliderMeta, scale);

  pucks.forEach(puck => {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(puck.x * scale, puck.y * scale)
        .setRotation(puck.angle ?? 0)
        .setLinearDamping(PHYSICS.linearDamping)
        .setAngularDamping(PHYSICS.angularDamping)
        .setCcdEnabled(true)
    );
    const collider = world.createCollider(
      RAPIER.ColliderDesc.ball(BOARD.puckRadius * scale)
        .setDensity(1)
        .setFriction(PHYSICS.friction)
        .setRestitution(PHYSICS.restitution)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      body
    );
    colliderMeta.set(collider.handle, { kind: 'puck', puckId: puck.id });
    bodies.push(body);
  });

  return { world, bodies, colliderMeta, eventQueue: new RAPIER.EventQueue(true) };
}

export function snapshotPucks(bodies, pucks) {
  const scale = PHYSICS.worldScale;
  return bodies.map((body, index) => {
    const position = body.translation();
    const velocity = body.linvel();
    return {
      id: pucks[index].id,
      x: position.x / scale,
      y: position.y / scale,
      angle: body.rotation(),
      color: pucks[index].color,
      speed: Math.hypot(velocity.x, velocity.y) / scale,
    };
  });
}

export function areSettled(bodies) {
  const threshold = PHYSICS.settleSpeed * PHYSICS.worldScale;
  return bodies.every(body => {
    const velocity = body.linvel();
    return Math.hypot(velocity.x, velocity.y) < threshold
      && Math.abs(body.angvel()) < PHYSICS.settleAngular;
  });
}

function launchVelocity(RAPIER, pucks, bodies, shot) {
  const scale = PHYSICS.worldScale;
  const index = pucks.findIndex(puck => puck.id === shot.puckId);
  if (index < 0) {
    throw new Error(`Unknown puck ${shot.puckId}`);
  }
  const body = bodies[index];
  if (shot.velocity) {
    body.setLinvel({ x: shot.velocity.x * scale, y: shot.velocity.y * scale }, true);
    return;
  }
  const { direction, speed } = computeShot(pucks[index], shot.dragPoint, shot.side);
  body.setLinvel({ x: direction.x * speed * scale, y: direction.y * speed * scale }, true);
}

function collectEvents(eventQueue, colliderMeta, bodyById, preSpeeds, frame) {
  const scale = PHYSICS.worldScale;
  const events = [];
  eventQueue.drainCollisionEvents((handle1, handle2, started) => {
    if (!started) return;
    const meta1 = colliderMeta.get(handle1);
    const meta2 = colliderMeta.get(handle2);
    if (!meta1 || !meta2) return;
    if (meta1.kind !== 'puck' && meta2.kind !== 'puck') return;

    const puckIds = [meta1, meta2].filter(meta => meta.kind === 'puck').map(meta => meta.puckId);
    const speed = Math.max(...puckIds.map(id => preSpeeds[id] ?? 0));
    if (speed < PHYSICS.settleSpeed) return;

    const positions = puckIds.map(id => bodyById.get(id).translation());
    events.push({
      frame,
      type: meta1.kind === 'puck' && meta2.kind === 'puck' ? 'puck-puck' : 'puck-wall',
      strength: Math.min(1, speed / PHYSICS.maxSpeed),
      x: positions.reduce((sum, position) => sum + position.x, 0) / positions.length / scale,
      y: positions.reduce((sum, position) => sum + position.y, 0) / positions.length / scale,
    });
  });
  return events;
}

export function simulateShot(RAPIER, pucks, shot, options = {}) {
  const {
    maxTime = PHYSICS.maxShotTime,
    recordFrames = true,
    frameStride = 1,
  } = options;

  const { world, bodies, colliderMeta, eventQueue } = createWorld(RAPIER, pucks);
  const frames = [];
  const events = [];
  const maxSteps = Math.max(1, Math.ceil(maxTime / PHYSICS.fixedDt));
  const bodyById = new Map(pucks.map((puck, index) => [puck.id, bodies[index]]));
  let settleTime = 0;
  let steps = 0;
  let settled = false;

  try {
    launchVelocity(RAPIER, pucks, bodies, shot);
    if (recordFrames) {
      frames.push({ t: 0, pucks: snapshotPucks(bodies, pucks) });
    }

    for (let step = 1; step <= maxSteps; step++) {
      const preSpeeds = {};
      bodies.forEach((body, index) => {
        const velocity = body.linvel();
        preSpeeds[pucks[index].id] = Math.hypot(velocity.x, velocity.y) / PHYSICS.worldScale;
      });

      world.step(eventQueue);
      steps = step;

      if (recordFrames && step % frameStride === 0) {
        frames.push({ t: step * PHYSICS.fixedDt, pucks: snapshotPucks(bodies, pucks) });
        const newEvents = collectEvents(eventQueue, colliderMeta, bodyById, preSpeeds, frames.length - 1);
        if (newEvents.length) events.push(...newEvents);
      } else {
        collectEvents(eventQueue, colliderMeta, bodyById, preSpeeds, 0);
      }

      if (areSettled(bodies)) {
        settleTime += PHYSICS.fixedDt;
        if (settleTime >= PHYSICS.settleTime) {
          settled = true;
          break;
        }
      } else {
        settleTime = 0;
      }
    }

    if (!settled) {
      bodies.forEach(body => {
        body.setLinvel({ x: 0, y: 0 }, false);
        body.setAngvel(0, false);
      });
    }

    return {
      frames,
      events,
      pucks: snapshotPucks(bodies, pucks),
      settled,
      duration: steps * PHYSICS.fixedDt,
    };
  } finally {
    eventQueue.free();
    world.free();
  }
}
