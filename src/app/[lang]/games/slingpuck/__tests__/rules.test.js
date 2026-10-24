import {
  initialPucks, sideOfPuck, countPucks, isHalfEmpty, nextSide,
  clampDragPoint, computeShot, winnerAfterShot,
} from '../core/rules';
import { BOARD, PHYSICS } from '../core/constants';

test('initial layout puts five scoreable pucks in each half', () => {
  const pucks = initialPucks();
  expect(pucks).toHaveLength(10);
  expect(countPucks(pucks, 'player')).toBe(5);
  expect(countPucks(pucks, 'opponent')).toBe(5);
  expect(isHalfEmpty(pucks, 'player')).toBe(false);
  expect(sideOfPuck({ x: 0, y: -1 })).toBe('player');
  expect(sideOfPuck({ x: 0, y: 1 })).toBe('opponent');
  expect(nextSide('player')).toBe('opponent');
  expect(nextSide('opponent')).toBe('player');
});

test('player drag clamps to a legal backward pull', () => {
  const start = { x: 0, y: -280 };
  const full = clampDragPoint(start, { x: 0, y: -900 }, 'player');
  expect(full.pull).toBeCloseTo(PHYSICS.maxPull);
  expect(full.power).toBeCloseTo(1);
  expect(full.y).toBeGreaterThanOrEqual(-(BOARD.height / 2 - BOARD.puckRadius - 2));
  expect(full.direction.y).toBeGreaterThan(0.4);

  const forward = clampDragPoint(start, { x: 0, y: -100 }, 'player');
  expect(forward.pull).toBe(0);
  expect(forward.power).toBe(0);
});

test('drag stays inside the own half and inside walls', () => {
  const start = { x: 300, y: -300 };
  const edge = clampDragPoint(start, { x: 2000, y: -2000 }, 'player');
  expect(edge.x).toBeLessThanOrEqual(BOARD.width / 2 - BOARD.puckRadius - 2);
  expect(edge.y).toBeLessThanOrEqual(-(BOARD.dividerThickness / 2 + BOARD.puckRadius + 2));
  expect(edge.pull).toBeLessThanOrEqual(PHYSICS.maxPull + 1e-9);
});

test('launch vector is opposite the pull for both sides', () => {
  const player = computeShot({ x: 0, y: -300 }, { x: 30, y: -420 }, 'player');
  expect(player.direction.y).toBeGreaterThan(0);
  expect(player.direction.x).toBeLessThan(0);

  const opponent = computeShot({ x: 0, y: 300 }, { x: -30, y: 420 }, 'opponent');
  expect(opponent.direction.y).toBeLessThan(0);
  expect(opponent.direction.x).toBeGreaterThan(0);
  expect(player.speed).toBeGreaterThanOrEqual(PHYSICS.minSpeed);
  expect(player.speed).toBeLessThanOrEqual(PHYSICS.maxSpeed + 1e-9);
});

test('winner follows first-empty-half positional rule', () => {
  // Only the shooter's half is empty: the shooter cleared it.
  expect(winnerAfterShot([{ id: 0, x: 0, y: 100 }], 'player')).toBe('player');
  // Only the opponent half is empty: the opponent cleared it.
  expect(winnerAfterShot([{ id: 0, x: 0, y: -100 }], 'player')).toBe('opponent');
  // Both empty: the shooter's action takes the round.
  expect(winnerAfterShot([], 'player')).toBe('player');
  expect(winnerAfterShot([], 'opponent')).toBe('opponent');
  expect(winnerAfterShot([
    { id: 0, x: 0, y: -100 },
    { id: 1, x: 0, y: 100 },
  ], 'opponent')).toBeNull();
});
