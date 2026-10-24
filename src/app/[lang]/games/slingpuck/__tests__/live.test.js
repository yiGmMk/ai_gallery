import { loadRapier } from '../core/physics';
import { LiveMatch, resolveWinner } from '../core/live';
import { FREE_AI, PHYSICS } from '../core/constants';

let RAPIER;
beforeAll(async () => { RAPIER = await loadRapier(); }, 30000);

test('free-mode tuning matches the spec', () => {
  expect(FREE_AI.cadenceMs).toEqual({ easy: 1800, normal: 1200, hard: 700 });
  expect(FREE_AI.search).toEqual({ candidates: { easy: 4, normal: 8, hard: 14 }, budgetMs: 80 });
});

test('both sides can shoot while the other side\'s puck is in flight', () => {
  const match = new LiveMatch(RAPIER);
  match.shoot({ side: 'player', puckId: 0, dragPoint: { x: -175, y: -385 } });
  match.step(4);
  const moving = match.pucks.find(p => p.id === 0);
  match.shoot({ side: 'opponent', puckId: 5, dragPoint: { x: 175, y: 385 } });
  const after = match.step(4);
  expect(moving.speed).toBeGreaterThan(0);
  expect(after.winner).toBeNull();
  expect(after.pucks.filter(p => p.speed > PHYSICS.settleSpeed).length).toBeGreaterThanOrEqual(2);
});

test('a fast puck cannot be shot; wrong half and short pulls are rejected', () => {
  const match = new LiveMatch(RAPIER);
  match.shoot({ side: 'player', puckId: 0, dragPoint: { x: -175, y: -385 } });
  match.step(6);
  expect(match.puckSpeed(0)).toBeGreaterThan(PHYSICS.settleSpeed);
  expect(() => match.shoot({ side: 'player', puckId: 0, dragPoint: { x: -175, y: -385 } }))
    .toThrow('Puck is moving too fast');
  expect(() => match.shoot({ side: 'player', puckId: 5, dragPoint: { x: 0, y: -100 } }))
    .toThrow("Not player's half");
  expect(() => match.shoot({ side: 'player', puckId: 1, dragPoint: { x: 175, y: -251 } }))
    .toThrow('Pull is too short');
});

test('a half emptying sets the winner and step() then freezes the board', () => {
  const match = new LiveMatch(RAPIER, {
    pucks: [
      { id: 0, x: 0, y: -260, angle: 0, color: 'black' },
      { id: 1, x: 0, y: 350, angle: 0, color: 'ivory' },
    ],
  });
  match.shoot({ side: 'player', puckId: 0, dragPoint: { x: 0, y: -430 } });
  for (let i = 0; i < 240 && !match.winner; i++) match.step(1);
  expect(match.winner).toBe('player');
  const frozen = match.pucks;
  expect(match.step(10).pucks).toEqual(frozen);
});

test('both halves emptying in one step awards the last shooter', () => {
  expect(resolveWinner({ playerEmpty: true, opponentEmpty: true, lastShooter: 'opponent' })).toBe('opponent');
  expect(resolveWinner({ playerEmpty: true, opponentEmpty: true, lastShooter: null })).toBe('player');
  expect(resolveWinner({ playerEmpty: true, opponentEmpty: false, lastShooter: null })).toBe('player');
  expect(resolveWinner({ playerEmpty: false, opponentEmpty: true, lastShooter: null })).toBe('opponent');
  expect(resolveWinner({ playerEmpty: false, opponentEmpty: false, lastShooter: 'player' })).toBeNull();
});

test('a frozen puck holds its place and thaws back to a moving body', () => {
  const match = new LiveMatch(RAPIER);
  match.shoot({ side: 'player', puckId: 0, dragPoint: { x: -175, y: -385 } });
  match.step(2);
  match.setFrozen(0, true);
  const held = match.pucks.find(p => p.id === 0);
  match.step(20);
  expect(match.pucks.find(p => p.id === 0)).toEqual(held);
  expect(() => match.shoot({ side: 'player', puckId: 0, dragPoint: { x: -175, y: -385 } }))
    .toThrow('Puck is frozen');
  match.setFrozen(0, false);
  expect(match.puckSpeed(0)).toBeGreaterThan(PHYSICS.settleSpeed);
});

test('reset restores a fresh 5/5 board at rest', () => {
  const match = new LiveMatch(RAPIER);
  match.shoot({ side: 'player', puckId: 0, dragPoint: { x: -175, y: -385 } });
  match.step(20);
  match.reset();
  expect(match.counts).toEqual({ player: 5, opponent: 5 });
  expect(match.winner).toBeNull();
  expect(match.pucks.every(p => p.speed === 0)).toBe(true);
});
