import { BOARD, INITIAL_PUCKS, MAX_DRAG_LATERAL, PHYSICS } from './constants';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const length = (x, y) => Math.hypot(x, y);

export function initialPucks() {
  return INITIAL_PUCKS.map(puck => ({ ...puck }));
}

export function sideOfPuck(puck) {
  return puck.y < 0 ? 'player' : 'opponent';
}

export function nextSide(side) {
  return side === 'player' ? 'opponent' : 'player';
}

export function forwardOf(side) {
  return side === 'player' ? { x: 0, y: 1 } : { x: 0, y: -1 };
}

export function backwardOf(side) {
  return side === 'player' ? { x: 0, y: -1 } : { x: 0, y: 1 };
}

export function countPucks(pucks, side) {
  return pucks.reduce((count, puck) => count + (sideOfPuck(puck) === side ? 1 : 0), 0);
}

export function isHalfEmpty(pucks, side) {
  return countPucks(pucks, side) === 0;
}

function halfBounds(side) {
  const inset = BOARD.puckRadius + 2;
  const xMin = -BOARD.width / 2 + inset;
  const xMax = BOARD.width / 2 - inset;
  if (side === 'player') {
    return {
      xMin,
      xMax,
      yMin: -BOARD.height / 2 + inset,
      yMax: -(BOARD.dividerThickness / 2 + inset),
    };
  }
  return {
    xMin,
    xMax,
    yMin: BOARD.dividerThickness / 2 + inset,
    yMax: BOARD.height / 2 - inset,
  };
}

function normalize(dx, dy, fallback) {
  const len = length(dx, dy);
  if (len < 1e-9) {
    return fallback;
  }
  return { x: dx / len, y: dy / len };
}

/**
 * Turns an arbitrary pointer position into a legal slingshot pull point in the
 * shooter's own half. Only backward pulls are allowed so every shot heads
 * toward the opponent's half.
 */
export function clampDragPoint(start, point, side) {
  const back = backwardOf(side);
  const rawX = point.x - start.x;
  const rawY = point.y - start.y;
  let along = Math.max(0, rawX * back.x + rawY * back.y);
  let lateral = rawX;
  if (along === 0) {
    lateral = 0;
  } else {
    lateral = clamp(lateral, -MAX_DRAG_LATERAL * along, MAX_DRAG_LATERAL * along);
  }

  let vx = back.x * along + lateral;
  let vy = back.y * along;
  const pullLength = length(vx, vy);
  if (pullLength > PHYSICS.maxPull) {
    const scale = PHYSICS.maxPull / pullLength;
    vx *= scale;
    vy *= scale;
  }

  const bounds = halfBounds(side);
  const x = clamp(start.x + vx, bounds.xMin, bounds.xMax);
  const y = clamp(start.y + vy, bounds.yMin, bounds.yMax);
  const pull = length(x - start.x, y - start.y);
  const direction = normalize(start.x - x, start.y - y, forwardOf(side));

  return {
    x,
    y,
    pull,
    power: clamp(pull / PHYSICS.maxPull, 0, 1),
    direction,
  };
}

export function computeShot(start, dragPoint, side) {
  const pullX = dragPoint.x - start.x;
  const pullY = dragPoint.y - start.y;
  const pullLength = length(pullX, pullY);
  const power = clamp(pullLength / PHYSICS.maxPull, 0, 1);
  const direction = normalize(-pullX, -pullY, forwardOf(side));
  const speed = PHYSICS.minSpeed + power * (PHYSICS.maxSpeed - PHYSICS.minSpeed);
  return { direction, speed, power, pullLength };
}

export function winnerAfterShot(pucks, shooter) {
  const shooterEmpty = isHalfEmpty(pucks, shooter);
  const opponentEmpty = isHalfEmpty(pucks, nextSide(shooter));
  if (shooterEmpty) {
    return shooter;
  }
  if (opponentEmpty) {
    return nextSide(shooter);
  }
  return null;
}
