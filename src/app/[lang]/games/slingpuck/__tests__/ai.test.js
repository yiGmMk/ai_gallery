import { loadRapier, simulateShot } from '../core/physics';
import { chooseShot, scoreResult, seededRng } from '../core/ai';
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

test('hard AI commits the scoring shot its search evaluated', () => {
  const pucks = [
    { id: 0, x: -175, y: -245, angle: 0, color: 'black' },
    { id: 1, x: 175, y: 245, angle: 0, color: 'ivory' },
    { id: 2, x: 0, y: 350, angle: 0, color: 'black' },
  ];
  const choice = chooseShot({
    rapier: RAPIER, pucks, side: 'player', difficulty: 'hard', rng: seededRng(5), now: noBudget,
  });
  const result = simulateShot(RAPIER, pucks, {
    puckId: choice.puckId, side: 'player', dragPoint: choice.dragPoint,
  });
  const after = result.pucks.find(p => p.id === choice.puckId);
  expect(after.y).toBeGreaterThan(0);
  expect(choice.score).toBeGreaterThan(50);
}, 20000);

test('scores a shot by how many pucks reach the opponent half', () => {
  const at = (id, y) => ({ id, x: 0, y, angle: 0, color: 'black' });
  const before = [0, 1, 2, 3, 4].map(id => at(id, -200 - id * 50))
    .concat([5, 6, 7, 8, 9].map(id => at(id, 200 + (id - 5) * 50)));
  // One own puck crosses; nobody comes back: own 4, opponent 6.
  const clean = before.map(p => (p.id === 0 ? at(0, 100) : p));
  // One own puck crosses, but two opponent pucks are dragged into own half.
  const messy = before.map(p => (p.id === 0 ? at(0, 100) : p.id === 5 || p.id === 6 ? at(p.id, -400 - p.id) : p));
  const noTime = { duration: 0 };
  expect(scoreResult(before, clean, 'player', noTime))
    .toBeGreaterThan(scoreResult(before, messy, 'player', noTime));
});

test('AI keeps shooting when its pucks rest against the end rail', () => {
  const pucks = [
    { id: 0, x: -8.8, y: -562.4, angle: 1.7, color: 'black' },
    { id: 4, x: 218, y: -564.9, angle: 2.6, color: 'black' },
    { id: 1, x: 175, y: 245, angle: 0, color: 'ivory' },
    { id: 2, x: 0, y: 350, angle: 0, color: 'ivory' },
  ];
  const choice = chooseShot({
    rapier: RAPIER, pucks, side: 'player', difficulty: 'hard', rng: seededRng(5), now: noBudget,
  });
  expect(choice.skip).toBeUndefined();
  expect(choice.pull).toBeGreaterThanOrEqual(16);
  const result = simulateShot(RAPIER, pucks, {
    puckId: choice.puckId, side: 'player', dragPoint: choice.dragPoint,
  });
  expect(result.pucks.find(p => p.id === choice.puckId).y).toBeGreaterThan(0);
}, 20000);
