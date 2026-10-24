import { loadRapier, simulateShot } from '../core/physics';
import { BOARD, PHYSICS } from '../core/constants';

let RAPIER;
beforeAll(async () => { RAPIER = await loadRapier(); }, 30000);

const puck = (id, x, y) => ({ id, x, y, angle: 0, color: 'black' });
const maxShot = (puckId, side = 'player') => ({
  puckId, side,
  dragPoint: side === 'player' ? { x: 0, y: -1000 } : { x: 0, y: 1000 },
});

test('full-power center shot passes through the gap', () => {
  const start = { x: 0, y: -260 };
  const result = simulateShot(RAPIER, [puck(0, start.x, start.y)], {
    puckId: 0, side: 'player', dragPoint: { x: 0, y: start.y - PHYSICS.maxPull },
  });
  expect(result.pucks[0].y).toBeGreaterThan(0);
});

test('off-center shot is blocked by the divider and stays on the board', () => {
  const result = simulateShot(RAPIER, [puck(0, 200, -260)], {
    puckId: 0, side: 'player', dragPoint: { x: 200, y: -430 },
  });
  expect(result.pucks[0].y).toBeLessThan(0);
  expect(Math.abs(result.pucks[0].x)).toBeLessThan(BOARD.width / 2);
});

test('ccd keeps an extreme shot inside the board', () => {
  const result = simulateShot(RAPIER, [puck(0, -340, -300)], {
    puckId: 0, velocity: { x: 9000, y: 7000 },
  }, { maxTime: 3 });
  const p = result.pucks[0];
  expect(Math.abs(p.x)).toBeLessThanOrEqual(BOARD.width / 2 - BOARD.puckRadius + 1);
  expect(Math.abs(p.y)).toBeLessThanOrEqual(BOARD.height / 2 - BOARD.puckRadius + 1);
});

test('pucks do not overlap after a shot', () => {
  const pucks = [puck(0, -80, -260), puck(1, 80, -260), puck(2, 0, -400)];
  const result = simulateShot(RAPIER, pucks, maxShot(0));
  for (let i = 0; i < result.pucks.length; i++) {
    for (let j = i + 1; j < result.pucks.length; j++) {
      const dx = result.pucks[i].x - result.pucks[j].x;
      const dy = result.pucks[i].y - result.pucks[j].y;
      expect(Math.hypot(dx, dy)).toBeGreaterThan(2 * BOARD.puckRadius - 3);
    }
  }
});

test('simulation is deterministic and reports collision events', () => {
  const pucks = [puck(0, 0, -260), puck(1, 0, -420)];
  const a = simulateShot(RAPIER, pucks, { puckId: 0, side: 'player', dragPoint: { x: 0, y: -430 } });
  const b = simulateShot(RAPIER, pucks, { puckId: 0, side: 'player', dragPoint: { x: 0, y: -430 } });
  expect(a.pucks).toEqual(b.pucks);
  expect(a.events.length).toBeGreaterThan(0);
  expect(a.frames.length).toBeGreaterThan(1);
  expect(a.settled).toBe(true);
});
