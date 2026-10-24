import { loadRapier } from '../core/physics';
import { chooseShot, seededRng } from '../core/ai';
import { initialPucks, sideOfPuck, clampDragPoint, computeShot } from '../core/rules';
import { DIFFICULTIES } from '../core/constants';

let RAPIER;
const noBudget = () => 0;
beforeAll(async () => { RAPIER = await loadRapier(); }, 30000);

test('every difficulty chooses a legal own-half puck and forward shot', () => {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const choice = chooseShot({ rapier: RAPIER, pucks: initialPucks(), side: 'opponent', difficulty, now: noBudget });
    const puck = initialPucks().find(p => p.id === choice.puckId);
    expect(sideOfPuck(puck)).toBe('opponent');
    expect(choice.pull).toBeGreaterThanOrEqual(16);
    expect(choice.direction.y).toBeLessThan(0);
  }
}, 20000);

test('same seed gives the same decision and difficulty uses different search sizes', () => {
  const easy = chooseShot({ rapier: RAPIER, pucks: initialPucks(), side: 'opponent', difficulty: 'easy', rng: seededRng(7), now: noBudget });
  const easyAgain = chooseShot({ rapier: RAPIER, pucks: initialPucks(), side: 'opponent', difficulty: 'easy', rng: seededRng(7), now: noBudget });
  expect(easy).toEqual(easyAgain);
  const hard = chooseShot({ rapier: RAPIER, pucks: initialPucks(), side: 'opponent', difficulty: 'hard', rng: seededRng(7), now: noBudget });
  expect(hard.candidatesChecked).toBeGreaterThan(easy.candidatesChecked);
  expect(DIFFICULTIES.hard.candidates).toBeGreaterThan(DIFFICULTIES.easy.candidates);
}, 20000);

test('skips instead of crashing when there is no puck in its half', () => {
  const choice = chooseShot({ rapier: RAPIER, pucks: [{ id: 0, x: 0, y: -100 }], side: 'opponent' });
  expect(choice).toEqual({ skip: true, reason: 'empty-half', candidatesChecked: 0 });
});

test('uses the shared legality rules for its generated drag point', () => {
  const pucks = initialPucks();
  const choice = chooseShot({ rapier: RAPIER, pucks, side: 'player', difficulty: 'hard', rng: seededRng(3), now: noBudget });
  const start = pucks.find(p => p.id === choice.puckId);
  const clamped = clampDragPoint(start, choice.dragPoint, 'player');
  const shot = computeShot(start, choice.dragPoint, 'player');
  expect(choice.dragPoint.x).toBeCloseTo(clamped.x);
  expect(choice.dragPoint.y).toBeCloseTo(clamped.y);
  expect(shot.direction.y).toBeGreaterThan(0);
}, 20000);
