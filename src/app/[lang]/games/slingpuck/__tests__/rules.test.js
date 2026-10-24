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

test('a drag past the board edge stays capped, backward and idempotent', () => {
  const start = { x: 300, y: -300 };
  const edge = clampDragPoint(start, { x: 2000, y: -2000 }, 'player');
  expect(edge.pull).toBeCloseTo(PHYSICS.maxPull);
  expect(edge.direction.y).toBeGreaterThan(0.4);
  expect(edge.y).toBeLessThan(start.y);
  // The engine re-clamps the AI's point; it must reproduce the same shot.
  const again = clampDragPoint(start, edge, 'player');
  expect(again.x).toBeCloseTo(edge.x, 6);
  expect(again.y).toBeCloseTo(edge.y, 6);
  expect(again.pull).toBeCloseTo(edge.pull, 6);
});

test('a puck pressed against its own end wall can still be shot', () => {
  // The rim leaves no room inside the board; the virtual pull may run past it.
  const start = { x: 0, y: -(BOARD.height / 2 - BOARD.puckRadius) };
  const pulled = clampDragPoint(start, { x: 0, y: start.y - PHYSICS.maxPull }, 'player');
  expect(pulled.pull).toBeCloseTo(PHYSICS.maxPull);
  expect(pulled.power).toBeCloseTo(1);
  expect(pulled.direction.y).toBeGreaterThan(0.99);

  const mirrored = clampDragPoint({ x: 0, y: -start.y }, { x: 0, y: -start.y + PHYSICS.maxPull }, 'opponent');
  expect(mirrored.pull).toBeCloseTo(PHYSICS.maxPull);
  expect(mirrored.direction.y).toBeLessThan(-0.99);
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
