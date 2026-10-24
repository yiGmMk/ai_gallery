import { PHYSICS } from './constants';
import { createWorld, snapshotPucks } from './physics';
import {
  clampDragPoint,
  computeShot,
  countPucks,
  initialPucks,
  isHalfEmpty,
  sideOfPuck,
} from './rules';

/**
 * Which side wins given the post-step half occupancy. Empty halves cannot be
 * observed with every crossing puck still in play, so the tie branch is kept
 * as a pure rule and tested directly.
 */
export function resolveWinner({ playerEmpty, opponentEmpty, lastShooter }) {
  if (!playerEmpty && !opponentEmpty) return null;
  if (playerEmpty && opponentEmpty) return lastShooter ?? 'player';
  return playerEmpty ? 'player' : 'opponent';
}

/**
 * A match that never stops simulating: both sides may shoot at any moment and
 * shots are applied to the live bodies. Turn-based MatchEngine stays separate.
 */
export class LiveMatch {
  constructor(rapier, { pucks = initialPucks() } = {}) {
    this.rapier = rapier;
    this.startPucks = pucks.map(puck => ({ ...puck }));
    this.closed = false;
    this.build();
  }

  build() {
    this.meta = this.startPucks.map(({ id, color }) => ({ id, color }));
    this.pucksById = new Map(this.startPucks.map(puck => [puck.id, puck]));
    this.bodyIndex = new Map(this.startPucks.map((puck, index) => [puck.id, index]));
    const created = createWorld(this.rapier, this.startPucks);
    this.world = created.world;
    this.bodies = created.bodies;
    this.colliderMeta = created.colliderMeta;
    this.eventQueue = created.eventQueue;
    this.frozen = new Set();
    this.frozenVelocity = new Map();
    this.winningSide = null;
    this.lastShooterSide = null;
    this.frame = 0;
  }

  get pucks() {
    if (!this.world) return [];
    return snapshotPucks(this.bodies, this.meta);
  }

  get counts() {
    const pucks = this.pucks;
    return { player: countPucks(pucks, 'player'), opponent: countPucks(pucks, 'opponent') };
  }

  get winner() {
    return this.winningSide;
  }

  get lastShooter() {
    return this.lastShooterSide;
  }

  puckSpeed(id) {
    const index = this.bodyIndex.get(id);
    if (index == null) return 0;
    const velocity = this.bodies[index].linvel();
    return Math.hypot(velocity.x, velocity.y) / PHYSICS.worldScale;
  }

  step(frames = 1) {
    const events = [];
    if (!this.world || this.closed) {
      return { pucks: this.pucks, counts: this.counts, winner: this.winner, events };
    }
    if (this.winningSide) {
      return { pucks: this.pucks, counts: this.counts, winner: this.winner, events };
    }

    for (let frame = 0; frame < frames; frame++) {
      const preSpeeds = new Map();
      this.bodies.forEach((body, index) => {
        const velocity = body.linvel();
        preSpeeds.set(this.meta[index].id, Math.hypot(velocity.x, velocity.y) / PHYSICS.worldScale);
      });
      this.world.step(this.eventQueue);
      this.frame += 1;
      this.collectEvents(preSpeeds, events);
      this.updateWinner();
      if (this.winningSide) break;
    }

    return { pucks: this.pucks, counts: this.counts, winner: this.winner, events };
  }

  shoot({ side, puckId, dragPoint }) {
    if (this.closed) throw new Error('Game is over');
    if (this.winningSide) throw new Error('Game is over');
    const index = this.bodyIndex.get(puckId);
    if (index == null) throw new Error(`Unknown puck ${puckId}`);
    const puck = this.pucks[index];
    if (sideOfPuck(puck) !== side) throw new Error(`Not ${side}'s half`);
    if (this.frozen.has(puckId)) throw new Error('Puck is frozen');
    if (puck.speed >= PHYSICS.settleSpeed) throw new Error('Puck is moving too fast');

    const start = { x: puck.x, y: puck.y };
    const clamped = clampDragPoint(start, dragPoint, side);
    if (clamped.pull < PHYSICS.minPull) throw new Error('Pull is too short');

    const shot = computeShot(start, clamped, side);
    const scale = PHYSICS.worldScale;
    this.bodies[index].setLinvel(
      { x: shot.direction.x * shot.speed * scale, y: shot.direction.y * shot.speed * scale },
      true
    );
    this.lastShooterSide = side;

    return {
      puckId,
      side,
      power: shot.power,
      direction: shot.direction,
      speed: shot.speed,
    };
  }

  setFrozen(puckId, frozen) {
    const index = this.bodyIndex.get(puckId);
    if (index == null) return;
    const body = this.bodies[index];
    if (!body) return;
    if (frozen) {
      this.frozenVelocity.set(puckId, {
        linvel: body.linvel(),
        angvel: body.angvel(),
      });
      body.setLinvel({ x: 0, y: 0 }, true);
      body.setAngvel(0, true);
      body.setBodyType(this.rapier.RigidBodyType.Fixed, true);
      this.frozen.add(puckId);
    } else {
      const saved = this.frozenVelocity.get(puckId);
      body.setBodyType(this.rapier.RigidBodyType.Dynamic, true);
      body.setLinvel(saved?.linvel ?? { x: 0, y: 0 }, true);
      body.setAngvel(saved?.angvel ?? 0, true);
      this.frozenVelocity.delete(puckId);
      this.frozen.delete(puckId);
    }
  }

  thawAll() {
    [...this.frozen].forEach(puckId => this.setFrozen(puckId, false));
  }

  reset() {
    this.disposeWorld();
    this.build();
  }

  free() {
    this.disposeWorld();
    this.closed = true;
  }

  disposeWorld() {
    if (!this.world) return;
    this.eventQueue?.free();
    this.world.free();
    this.world = null;
    this.bodies = [];
    // Frozen bookkeeping belongs to the disposed bodies; a thaw after free
    // (component cleanup order is not guaranteed) must be a no-op.
    this.frozen = new Set();
    this.frozenVelocity = new Map();
  }

  updateWinner() {
    const pucks = this.pucks;
    this.winningSide = resolveWinner({
      playerEmpty: isHalfEmpty(pucks, 'player'),
      opponentEmpty: isHalfEmpty(pucks, 'opponent'),
      lastShooter: this.lastShooterSide,
    });
  }

  collectEvents(preSpeeds, events) {
    this.eventQueue.drainCollisionEvents((handle1, handle2, started) => {
      if (!started) return;
      const meta1 = this.colliderMeta.get(handle1);
      const meta2 = this.colliderMeta.get(handle2);
      if (!meta1 || !meta2) return;
      if (meta1.kind !== 'puck' && meta2.kind !== 'puck') return;
      const ids = [meta1, meta2].filter(meta => meta.kind === 'puck').map(meta => meta.puckId);
      const speed = Math.max(...ids.map(id => preSpeeds.get(id) ?? 0));
      if (speed < PHYSICS.settleSpeed) return;
      const positions = ids.map(id => this.bodies[this.bodyIndex.get(id)].translation());
      const scale = PHYSICS.worldScale;
      events.push({
        frame: this.frame,
        type: meta1.kind === 'puck' && meta2.kind === 'puck' ? 'puck-puck' : 'puck-wall',
        strength: Math.min(1, speed / PHYSICS.maxSpeed),
        x: positions.reduce((sum, position) => sum + position.x, 0) / positions.length / scale,
        y: positions.reduce((sum, position) => sum + position.y, 0) / positions.length / scale,
      });
    });
  }
}
