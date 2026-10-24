import { loadRapier } from '../core/physics';
import { MatchEngine } from '../core/engine';
import { initialPucks } from '../core/rules';

let RAPIER;
beforeAll(async () => { RAPIER = await loadRapier(); }, 30000);

const immediateWin = () => ({
  frames: [], events: [], settled: true, duration: 1,
  pucks: [{ id: 0, x: 0, y: 100, angle: 0, color: 'black' }],
});

test('starts with five pucks per side and player turn', () => {
  const engine = new MatchEngine(RAPIER);
  expect(engine.currentSide).toBe('player');
  expect(engine.turn).toBe(1);
  expect(engine.winner).toBeNull();
  expect(engine.pucks.filter(p => p.y < 0)).toHaveLength(5);
});

test('rejects shots from the wrong side, wrong half, or after the game', () => {
  const engine = new MatchEngine(RAPIER);
  const opponentPuck = engine.pucks.find(p => p.y > 0);
  expect(() => engine.shoot({ side: 'opponent', puckId: opponentPuck.id, dragPoint: { x: 0, y: 400 } })).toThrow();
  expect(() => engine.shoot({ side: 'player', puckId: opponentPuck.id, dragPoint: { x: 0, y: 400 } })).toThrow();

  const finished = new MatchEngine(RAPIER, {
    pucks: [{ id: 0, x: 0, y: -200, angle: 0, color: 'black' }],
    simulate: immediateWin,
  });
  finished.shoot({ side: 'player', puckId: 0, dragPoint: { x: 0, y: -350 } });
  expect(finished.winner).toBe('player');
  expect(() => finished.shoot({ side: 'player', puckId: 0, dragPoint: { x: 0, y: -350 } })).toThrow();
});

test('rejects pulls below the minimum and forward drags', () => {
  const engine = new MatchEngine(RAPIER);
  const puck = engine.pucks.find(p => p.y < 0);
  expect(() => engine.shoot({ side: 'player', puckId: puck.id, dragPoint: { x: puck.x, y: puck.y - 5 } })).toThrow();
  expect(() => engine.shoot({ side: 'player', puckId: puck.id, dragPoint: { x: puck.x, y: puck.y + 120 } })).toThrow();
});

test('a legal shot updates pucks, switches turn and returns playback data', () => {
  const engine = new MatchEngine(RAPIER);
  const puck = engine.pucks.find(p => p.y < 0);
  const result = engine.shoot({ side: 'player', puckId: puck.id, dragPoint: { x: puck.x, y: puck.y - 150 } });
  expect(result.frames.length).toBeGreaterThan(1);
  expect(result.nextSide).toBe('opponent');
  expect(engine.currentSide).toBe('opponent');
  expect(engine.turn).toBe(2);
  expect(result.pucks).toEqual(engine.pucks);
});

test('pucks are the same data left in the current rules state', () => {
  const engine = new MatchEngine(RAPIER);
  const pucks = engine.pucks;
  pucks[0].y = 999;
  expect(engine.pucks[0].y).not.toBe(999);
});

test('winner detection uses the injected simulator state', () => {
  const engine = new MatchEngine(RAPIER, {
    pucks: [{ id: 0, x: 0, y: -200, angle: 0, color: 'black' }],
    simulate: immediateWin,
  });
  const result = engine.shoot({ side: 'player', puckId: 0, dragPoint: { x: 0, y: -350 } });
  expect(result.winner).toBe('player');
  expect(engine.winner).toBe('player');
});

test('timeout passes the turn and reset restores a new game', () => {
  const engine = new MatchEngine(RAPIER);
  expect(engine.passTurn('timeout')).toEqual({ side: 'opponent', turn: 2 });
  expect(engine.currentSide).toBe('opponent');
  engine.reset();
  expect(engine.currentSide).toBe('player');
  expect(engine.turn).toBe(1);
  expect(engine.pucks).toHaveLength(10);
  expect(engine.pucks).toEqual(initialPucks());
});

test('passTurn is a no-op after a winner', () => {
  const engine = new MatchEngine(RAPIER, {
    pucks: [{ id: 0, x: 0, y: -200, angle: 0, color: 'black' }],
    simulate: immediateWin,
  });
  engine.shoot({ side: 'player', puckId: 0, dragPoint: { x: 0, y: -350 } });
  const before = { side: engine.currentSide, turn: engine.turn };
  expect(engine.passTurn('timeout')).toEqual(before);
});
