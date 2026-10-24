# Sling Puck Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete human-vs-AI 2.5D sling-puck game to the ai_gallery Next.js site, with Three.js visuals, Rapier 2D physics, three AI difficulties, i18n, tests, and browser-verified full match.

**Architecture:** A headless `MatchEngine` owns rules, legal-shot validation, Rapier simulation, turn switching and winner detection. `chooseShot` is an AI policy over that engine. A Three.js `SlingPuckScene` renders the board and plays back simulation frames; a React client component owns input, HUD, countdown and AI scheduling. No server code this round.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind, Three.js 0.169, `@dimforge/rapier2d-compat` 0.21, Jest.

**Spec:** `docs/superpowers/specs/2026-10-24-slingpuck-design.md`

## Global Constraints

- Only human-vs-AI this round: no Colyseus, WebSocket, matchmaking, friend rooms, accounts or server package.
- JavaScript, not TypeScript; use JSDoc where types are non-obvious; match existing repo conventions.
- All new browser-only code must be safe under Next SSR: no `window`, `document`, WebGL or WASM access at module top level.
- Board physics coordinates: player half `y < 0`, opponent half `y > 0`; player always rendered at screen bottom.
- Board 720 × 1200; puck radius 34; divider thickness 24; gap opening 76; max pull 170; initial 5 pucks per side.
- Turn timer 30 s; max shot simulation 8 s; fixed physics step 1/60 s.
- UI strings must exist in both `src/app/dictionaries/en.json` and `zh.json`.
- Do not alter existing game behavior; only additive config/dictionary changes.
- Tests run with `pnpm test`; production build with `pnpm build`.

## Review Focus

- Dragging from the wrong half, or dragging forward past the puck, must never launch: the drag clamps to a legal backward cone, or cancels below minimum pull.
- A turn timeout while the player is mid-drag must cancel the drag cleanly and pass the turn without queueing a shot.
- Extreme shots near a wall/corner or directly at the divider must not let any puck leave the board or tunnel through anything except the center gap.
- AI must degrade to `passTurn` rather than crash if its half has no legal puck or every pull clamps to zero.
- Restarting, changing difficulty, or unmounting while a shot plays or AI is thinking must cancel pending timers/animation and never apply a stale shot to the new game.

---

### Task 1: Constants and pure rules

**Files:**
- Create: `src/app/[lang]/games/slingpuck/core/constants.js`
- Create: `src/app/[lang]/games/slingpuck/core/rules.js`
- Test: `src/app/[lang]/games/slingpuck/__tests__/rules.test.js`
- Modify: `package.json`, `pnpm-lock.yaml` (dependency install)

**Interfaces:**
- Produces `BOARD` (`width, height, wall, frame, dividerThickness, gapWidth, dividerCapRadius, puckRadius, puckHeight, bandInset, surfaceY`), `PHYSICS` (`fixedDt, maxSpeed, minSpeed, maxPull, minPull, linearDamping, angularDamping, friction, restitution, settleSpeed, settleAngular, settleTime, maxShotTime`), `TURN_SECONDS`, `INITIAL_PUCKS` (10 items `{id, x, y, angle, color}`), `DIFFICULTIES`.
- Produces `initialPucks()`, `sideOfPuck(puck)`, `countPucks(pucks, side)`, `isHalfEmpty(pucks, side)`, `nextSide(side)`, `forwardOf(side)`, `clampDragPoint(start, point, side)`, `computeShot(start, dragPoint, side)`, `winnerAfterShot(pucks, shooter)`.
- `clampDragPoint` returns `{x, y, pull, power, direction}` where `direction` is the launch direction (`unit` vector) and `power` is 0..1. `computeShot` returns `{direction, speed, power, pullLength}`.

- [ ] **Step 1: Install the physics dependency**

Run: `pnpm add @dimforge/rapier2d-compat@^0.21.0`
Expected: `package.json` contains `"@dimforge/rapier2d-compat"` and lockfile updates.

- [ ] **Step 2: Write the failing rules test**

```js
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
  const playerOnly = [{ id: 0, x: 0, y: -100 }];
  const opponentOnly = [{ id: 0, x: 0, y: 100 }];
  expect(winnerAfterShot(playerOnly, 'player')).toBe('player');
  expect(winnerAfterShot(opponentOnly, 'player')).toBe('opponent');
  expect(winnerAfterShot([], 'player')).toBe('player');
  expect(winnerAfterShot([], 'opponent')).toBe('opponent');
  expect(winnerAfterShot([{ id: 0, x: 0, y: -100 }], 'opponent')).toBeNull();
});
```

- [ ] **Step 3: Run it and confirm failure**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/rules.test.js`
Expected: FAIL — cannot resolve `../core/rules`.

- [ ] **Step 4: Implement constants and rules**

Use these exact values:

```js
// constants.js
export const BOARD = Object.freeze({
  width: 720, height: 1200, wall: 34, frame: 54,
  dividerThickness: 24, gapWidth: 100, dividerCapRadius: 12,
  puckRadius: 34, puckHeight: 30, bandInset: 200, surfaceY: 31,
});
export const PHYSICS = Object.freeze({
  fixedDt: 1 / 60, maxSpeed: 2350, minSpeed: 520, maxPull: 170, minPull: 16,
  linearDamping: 1.35, angularDamping: 2.6, friction: 0.22, restitution: 0.58,
  settleSpeed: 16, settleAngular: 0.8, settleTime: 0.45, maxShotTime: 8,
});
export const TURN_SECONDS = 30;
```

`clampDragPoint` logic: project the raw drag onto the backward unit vector; clamp `along` to `[0, maxPull]`; clamp lateral to `1.6 × along`; build the point, clamp x to `[-w/2+r+2, w/2-r+2]` and y to the own-half bounds (`player`: `-(h/2-r-2)`..`-(divider/2+r+2)`; `opponent`: mirror); recompute pull; power = `min(pull/maxPull, 1)`; direction = normalized `start - point` with fallback forward vector when pull is 0.

`computeShot`: `pullLength = hypot(drag-start)`; power = `min(pullLength/maxPull, 1)`; direction = normalized `start-drag`; speed = `minSpeed + power*(maxSpeed-minSpeed)`.

`winnerAfterShot`: check `isHalfEmpty(pucks, shooter)` and `isHalfEmpty(pucks, nextSide(shooter))`; both empty or only shooter empty → shooter; only other empty → other; otherwise null.

- [ ] **Step 5: Run rules tests and the full suite**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/rules.test.js`
Expected: PASS.
Run: `pnpm test`
Expected: all existing and new tests PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/app/\[lang\]/games/slingpuck/core src/app/\[lang\]/games/slingpuck/__tests__/rules.test.js
git commit -m "feat(slingpuck): add board constants and pure rules"
```

---

### Task 2: Rapier physics and shot simulation

**Files:**
- Create: `src/app/[lang]/games/slingpuck/core/physics.js`
- Test: `src/app/[lang]/games/slingpuck/__tests__/physics.test.js`

**Interfaces:**
- Producer `loadRapier(): Promise<object>` — initialized Rapier module (cache the promise).
- Producer `createWorld(RAPIER, pucks): { world, bodies, colliderMeta, eventQueue }`.
- Producer `simulateShot(RAPIER, pucks, shot, options?): { frames, events, pucks, settled, duration }`.
  - `shot` is `{ puckId, side, dragPoint }` or `{ puckId, velocity: {x,y} }`.
  - `options`: `{ maxTime = PHYSICS.maxShotTime, recordFrames = true, frameStride = 1 }`.
  - `frames`: `[{ t, pucks: [{ id, x, y, angle }] }]`, including t=0.
  - `events`: `[{ frame, type: 'puck-puck' | 'puck-wall', strength: 0..1, x, y }]`.
- Producer `snapshotPucks(bodies, pucks)`, `areSettled(bodies)` for engine reuse.

- [ ] **Step 1: Write the failing physics test**

```js
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
```

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/physics.test.js`
Expected: FAIL — cannot resolve `../core/physics`.

- [ ] **Step 3: Implement physics.js**

Implementation notes:
- `loadRapier` dynamically imports the compat package, calls `RAPIER.init()`, normalizes `mod.default ?? mod`, caches it.
- `createWorld` builds one dynamic ball body per puck with `setCcdEnabled(true)`, damping, and collider ball; fixed cuboids for four outer walls; two divider cuboids plus fixed ball caps at `x = ±gapWidth/2`, creating a 76-unit opening; attach `ActiveEvents.COLLISION_EVENTS` to every collider.
- Track `colliderMeta` mapping collider handle → `{ kind: 'puck'|'puck-wall', puckId? }`.
- `simulateShot` creates a world from state, applies either launch velocity or `computeShot`-derived velocity, steps fixed `PHYSICS.fixedDt`, records frames/events, treats all bodies as settled when `|v| < settleSpeed` and `|w| < settleAngular` for `settleTime`, and force-zeroes velocities after `maxTime`. Always `world.free()` in a `finally`.
- Collision strength uses pre-step body speeds; ignore `started === false`; map collider handles to metadata.
- Frame indices in events are the frame array indices at which they occurred.
- Keep gravity zero; do not use gravity or friction beyond the constants.
- Handle `recordFrames: false` by returning an empty frames array for AI performance.

- [ ] **Step 4: Run physics tests**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/physics.test.js`
Expected: PASS. If Jest fails on WASM/module transform, add an explicit `@dimforge` transform exception in `jest.config.js` and re-run.

- [ ] **Step 5: Commit**

```bash
git add src/app/\[lang\]/games/slingpuck/core/physics.js src/app/\[lang\]/games/slingpuck/__tests__/physics.test.js
git commit -m "feat(slingpuck): simulate pucks with Rapier 2D"
```

---

### Task 3: Match engine (turns, shots, winner, timeout)

**Files:**
- Create: `src/app/[lang]/games/slingpuck/core/engine.js`
- Test: `src/app/[lang]/games/slingpuck/__tests__/engine.test.js`

**Interfaces:**
- Consumes `initialPucks`, `sideOfPuck`, `clampDragPoint`/`computeShot`, `winnerAfterShot`, `simulateShot`.
- Produces `class MatchEngine`:
  - `constructor(rapier, { side = 'player', pucks = initialPucks(), simulate = simulateShot } = {})`
  - getters `currentSide`, `winner`, `pucks` (copy), `turn`.
  - `canShoot(side, puckId): boolean`
  - `shoot({ side, puckId, dragPoint }): { shot, frames, events, pucks, settled, duration, winner, nextSide, turn }` — throws `Error` for illegal shots.
  - `passTurn(reason = 'timeout'): { side, turn }`
  - `reset({ side = 'player', pucks = initialPucks() } = {})`.

- [ ] **Step 1: Write the failing engine test**

```js
import { loadRapier } from '../core/physics';
import { MatchEngine } from '../core/engine';
import { initialPucks } from '../core/rules';

let RAPIER;
beforeAll(async () => { RAPIER = await loadRapier(); }, 30000);

test('starts with five pucks per side and player turn', () => {
  const engine = new MatchEngine(RAPIER);
  expect(engine.currentSide).toBe('player');
  expect(engine.turn).toBe(1);
  expect(engine.winner).toBeNull();
  expect(engine.pucks.filter(p => p.y < 0)).toHaveLength(5);
});

test('rejects shots from the wrong side, wrong half, or after the game', () => {
  const engine = new MatchEngine(RAPIER);
  expect(() => engine.shoot({ side: 'opponent', puckId: 6, dragPoint: { x: 0, y: 400 } })).toThrow();
  expect(() => engine.shoot({ side: 'player', puckId: 6, dragPoint: { x: 0, y: 400 } })).toThrow();
  engine.winner = 'player';
  expect(() => engine.shoot({ side: 'player', puckId: 0, dragPoint: { x: 0, y: -400 } })).toThrow();
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

test('winner detection uses the injected simulator state', () => {
  const fakeSimulate = () => ({
    frames: [], events: [], settled: true, duration: 1,
    pucks: [{ id: 0, x: 0, y: 100, angle: 0, color: 'black' }],
  });
  const engine = new MatchEngine(RAPIER, {
    pucks: [{ id: 0, x: 0, y: -200, angle: 0, color: 'black' }],
    simulate: fakeSimulate,
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
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/engine.test.js`
Expected: FAIL — cannot resolve `../core/engine`.

- [ ] **Step 3: Implement engine.js**

Rules:
- `canShoot` requires no winner, `side === currentSide`, puck exists, and `sideOfPuck(puck) === side`.
- `shoot` computes the shot via `computeShot(start, dragPoint, side)`, requires `pullLength >= minPull`, calls `simulate` with `{ puckId, side, dragPoint }`, replaces pucks with result pucks, sets winner via `winnerAfterShot`, advances turn; if winner, current side stays for display but further shots throw.
- `passTurn` is a no-op when a winner exists; otherwise switches side and increments turn.
- `reset` clears winner and restores given pucks/side/turn=1.
- Deep-copy states on reads to keep callers from mutating engine state.

- [ ] **Step 4: Run engine tests**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/\[lang\]/games/slingpuck/core/engine.js src/app/\[lang\]/games/slingpuck/__tests__/engine.test.js
git commit -m "feat(slingpuck): add match engine with turn and win rules"
```

---

### Task 4: AI policy

**Files:**
- Create: `src/app/[lang]/games/slingpuck/core/ai.js`
- Test: `src/app/[lang]/games/slingpuck/__tests__/ai.test.js`

**Interfaces:**
- Consumes `DIFFICULTIES`, `BOARD`, `PHYSICS`, rules helpers; `simulateShot`.
- Produces `seededRng(seed): () => number` and `chooseShot({ rapier, pucks, side, difficulty = 'normal', rng = seededRng(1), simulate = simulateShot }): { puckId, dragPoint, pull, power, direction, score, simulated, candidatesChecked }`.
- If no legal puck exists, returns `{ skip: true, reason: 'empty-half', candidatesChecked: 0 }`.

- [ ] **Step 1: Write the failing AI test**

```js
import { loadRapier } from '../core/physics';
import { chooseShot, seededRng } from '../core/ai';
import { initialPucks, sideOfPuck, clampDragPoint, computeShot } from '../core/rules';
import { DIFFICULTIES } from '../core/constants';

let RAPIER;
beforeAll(async () => { RAPIER = await loadRapier(); }, 30000);

test('every difficulty chooses a legal own-half puck and forward shot', () => {
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const choice = chooseShot({ rapier: RAPIER, pucks: initialPucks(), side: 'opponent', difficulty });
    const puck = initialPucks().find(p => p.id === choice.puckId);
    expect(sideOfPuck(puck)).toBe('opponent');
    expect(choice.pull).toBeGreaterThanOrEqual(16);
    expect(choice.direction.y).toBeLessThan(0);
  }
});

test('same seed gives the same decision and difficulty uses different search sizes', () => {
  const easy = chooseShot({ rapier: RAPIER, pucks: initialPucks(), side: 'opponent', difficulty: 'easy', rng: seededRng(7) });
  const easyAgain = chooseShot({ rapier: RAPIER, pucks: initialPucks(), side: 'opponent', difficulty: 'easy', rng: seededRng(7) });
  expect(easy).toEqual(easyAgain);
  const hard = chooseShot({ rapier: RAPIER, pucks: initialPucks(), side: 'opponent', difficulty: 'hard', rng: seededRng(7) });
  expect(hard.candidatesChecked).toBeGreaterThan(easy.candidatesChecked);
  expect(DIFFICULTIES.hard.candidates).toBeGreaterThan(DIFFICULTIES.easy.candidates);
});

test('skips instead of crashing when there is no puck in its half', () => {
  const choice = chooseShot({ rapier: RAPIER, pucks: [{ id: 0, x: 0, y: -100 }], side: 'opponent' });
  expect(choice).toEqual({ skip: true, reason: 'empty-half', candidatesChecked: 0 });
});

test('uses the shared legality rules for its generated drag point', () => {
  const pucks = initialPucks();
  const choice = chooseShot({ rapier: RAPIER, pucks, side: 'player', difficulty: 'hard', rng: seededRng(3) });
  const start = pucks.find(p => p.id === choice.puckId);
  const clamped = clampDragPoint(start, choice.dragPoint, 'player');
  const shot = computeShot(start, choice.dragPoint, 'player');
  expect(choice.dragPoint.x).toBeCloseTo(clamped.x);
  expect(choice.dragPoint.y).toBeCloseTo(clamped.y);
  expect(shot.direction.y).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/ai.test.js`
Expected: FAIL — cannot resolve `../core/ai`.

- [ ] **Step 3: Implement ai.js**

Algorithm:
1. `own = pucks.filter(p => sideOfPuck(p) === side)`; empty → skip.
2. Build target points in the opponent half: x ∈ `{-240, 0, 240}`, forward distance ∈ `{240, 380, 520, 620}`; add a straight-through-hole target.
3. For each own puck, each target, and power ∈ `{0.55, 0.72, 0.88, 1}`: direction = normalize(target - puck); dragPoint = clampDragPoint(puck, puck - direction × `power*maxPull`, side) (pull toward own band). Skip if pull < minPull.
4. Simulate with `{ recordFrames: false, maxTime: 3 }`; track elapsed wall-clock time and stop searching once 250 ms is spent, keeping the best candidate found. Score:
   `ownDelta*120 + oppGain*25 + (ownAfter===0 ? 800 : 0) - (oppAfter===0 ? 800 : 0)`, plus ±2000 for simulated winner, minus `duration*0.5`.
5. Sort by score; selection: easy picks randomly from the top 40% (score within 120 of best), normal top 3, hard top 1.
6. Apply difficulty's Gaussian angle error (Box–Muller using provided rng) and power multiplier error, then clamp the resulting drag point again with `clampDragPoint`. Recompute `pull`, `power`, `direction`.
7. Return the choice plus `simulated` summary and `candidatesChecked`.
8. Cap hard total candidates at `DIFFICULTIES.hard.candidates`, normal at its count, easy at its count; generate deterministic ordering and slice. Use `Date.now()` for the budget only in production search; expose an optional `now` function so tests can inject a counter.

- [ ] **Step 4: Run AI tests**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/ai.test.js`
Expected: PASS. Tune candidate counts if a test exposes an invalid/clamped shot.

- [ ] **Step 5: Commit**

```bash
git add src/app/\[lang\]/games/slingpuck/core/ai.js src/app/\[lang\]/games/slingpuck/__tests__/ai.test.js
git commit -m "feat(slingpuck): add three-level AI shot search"
```

---

### Task 5: Three.js scene, textures, audio

**Files:**
- Create: `src/app/[lang]/games/slingpuck/render/coordinates.js`
- Create: `src/app/[lang]/games/slingpuck/render/textures.js`
- Create: `src/app/[lang]/games/slingpuck/render/audio.js`
- Create: `src/app/[lang]/games/slingpuck/render/scene.js`
- Test: `src/app/[lang]/games/slingpuck/__tests__/coordinates.test.js`

**Interfaces:**
- `coordinates.js` produces `SCENE_SCALE = 0.01`, `physicsToScene(x, y) -> { x, z }`, `sceneToPhysics(x, z) -> { x, y }`.
- `textures.js` produces `makeWoodTexture()`, `makeBoardTexture()`, `makePuckTopTexture(color)`, `makeGlowTexture()`, `makeEnvironmentTexture()`, `makeSoftShadowTexture()`.
- `audio.js` produces `class SlingPuckAudio { unlock(); launch(power); impact(strength, kind); win(); setMuted(muted); dispose(); }`.
- `scene.js` produces `class SlingPuckScene`:
  - `constructor(canvas, container, { audio } = {})`
  - `resize()`
  - `syncPucks(pucks)`
  - `setInteractiveSide(side)`
  - `beginDrag(puckId)`, `updateDrag({ puckId, start, dragPoint, power, side })`, `cancelDrag()`, `clearDrag()`
  - `playShot({ startPucks, frames, events, shot, onDone })`
  - `pickPuck(clientX, clientY): { id, x, y, angle } | null`
  - `boardPoint(clientX, clientY): { x, y } | null`
  - `getPuckScreenPoint(puckId): { x, y } | null` (canvas-relative, for dev browser verification)
  - `getSize(): { width, height }`
  - `setPlaybackRate(rate)`
  - `dispose()`

- [ ] **Step 1: Write the failing coordinate test**

```js
import { physicsToScene, sceneToPhysics, SCENE_SCALE } from '../render/coordinates';

test('maps player half to screen-bottom scene z and round-trips', () => {
  expect(physicsToScene(100, -200)).toEqual({ x: 100 * SCENE_SCALE, z: 200 * SCENE_SCALE });
  expect(physicsToScene(0, 300)).toEqual({ x: 0, z: -300 * SCENE_SCALE });
  const back = sceneToPhysics(...Object.values(physicsToScene(-75, 125)));
  expect(back.x).toBeCloseTo(-75);
  expect(back.y).toBeCloseTo(125);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/coordinates.test.js`
Expected: FAIL — cannot resolve `../render/coordinates`.

- [ ] **Step 3: Implement coordinates, textures and audio**

- Coordinates: `physicsToScene(x,y) = {x: x*S, z: -y*S}`; inverse `{x: x/S, y: -z/S}`.
- Textures: all Canvas 2D generated. Wood: warm tan base, wavy darker grain, subtle knots. Board print: center target circle with red ring, dashed center line, tick marks, "SLING PUCK" text, thin panel lines. Puck tops: concentric rings + off-center dot. Glow/soft shadow: radial gradients. Environment: 1024×512 vertical studio gradient for PMREM.
- Audio: lazily create `AudioContext` on `unlock()`; use short oscillator/noise bursts for launch, impact (volume/pitch by strength), win arpeggio; `setMuted(true)` master gain 0; guard all calls when context unavailable or disposed.

- [ ] **Step 4: Implement scene.js**

Scene structure:
- WebGLRenderer (antialias, sRGB, ACES tone mapping, shadows PCFSoft), OrthographicCamera fixed oblique ~50° above board, camera fit to container aspect with board margins.
- Board base box + top printed plane + four frame rails + inset play mat; divider two wood boxes with rounded cylinder end caps; gold band anchor posts at ±(width/2−20) and band y = ∓400; black TubeGeometry elastic bands.
- Five+five pucks built as groups: CylinderGeometry with side/top/bottom materials, torus rim, top dot, soft shadow quad, gold glow quad toggled by `setInteractiveSide`.
- Raycaster: `pickPuck` intersects puck meshes and returns board coords; `boardPoint` intersects the board surface plane.
- `updateDrag`: move the dragged puck mesh visually toward dragPoint (clamped scene coords), set band curve through the drag point with 5 control points, update the aim arrow from the puck's original position in the launch direction (length scaled by power), and pulse the power glow.
- `playShot`: first tween the dragged puck mesh back from drag point to the frame-0 position over 90 ms/rate, then step through frames with rAF at 60 fps × playbackRate; on crossing event frames call `audio.impact` and spawn expanding floor rings (pool, additive); on completion `syncPucks(final)` and call `onDone`. Cancel any in-flight playback on a new `playShot`/`dispose`.
- Add gentle camera shake proportional to impact strength (decays).
- Ensure `dispose()` removes rAF, observer, DOM listeners, geometries, materials, textures, renderer and environment.
- No resize observer leak; handle container zero-size.

- [ ] **Step 5: Run coordinate test and full suite**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/coordinates.test.js`
Expected: PASS.
Run: `pnpm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/\[lang\]/games/slingpuck/render src/app/\[lang\]/games/slingpuck/__tests__/coordinates.test.js
git commit -m "feat(slingpuck): add 2.5D board scene and audio"
```

---

### Task 6: React UI, input, timer and AI loop

**Files:**
- Create: `src/app/[lang]/games/slingpuck/content.js`
- Create: `src/app/[lang]/games/slingpuck/components/StartPanel.js`
- Create: `src/app/[lang]/games/slingpuck/components/GameHud.js`
- Create: `src/app/[lang]/games/slingpuck/components/ResultPanel.js`
- Create: `src/app/[lang]/games/slingpuck/ui/format.js`
- Test: `src/app/[lang]/games/slingpuck/__tests__/panels.test.jsx`

**Interfaces:**
- Consumes `loadRapier`, `MatchEngine`, `chooseShot`, `seededRng`, `clampDragPoint`, `sideOfPuck`, `SlingPuckScene`, `SlingPuckAudio`, i18n `useI18n`.
- `content.js` default-exports `SlingPuckGame({ lang })`.
- `formatClock(seconds): 'm:ss'`.
- `StartPanel({ difficulty, onDifficulty, onStart, disabled, t })`; `GameHud({ side, counts, timeLeft, power, dragging, message, muted, onToggleSound, t })`; `ResultPanel({ winner, onRestart, onMenu, t })` with `winner` `'player'|'opponent'`.

- [ ] **Step 1: Write the failing panel/format test**

```jsx
import { formatClock } from '../ui/format';
import { StartPanel } from '../components/StartPanel';
import { render, screen } from '@testing-library/react';

test('formats the turn clock', () => {
  expect(formatClock(30)).toBe('0:30');
  expect(formatClock(9)).toBe('0:09');
  expect(formatClock(0)).toBe('0:00');
});

test('start panel offers three difficulties and starts disabled until ready', () => {
  const t = key => ({ slingpuck_easy: 'Easy', slingpuck_normal: 'Normal', slingpuck_hard: 'Hard', slingpuck_start: 'Start' }[key] || key);
  const { rerender } = render(<StartPanel difficulty="normal" onDifficulty={() => {}} onStart={() => {}} disabled t={t} />);
  expect(screen.getByRole('button', { name: 'Easy' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
  rerender(<StartPanel difficulty="normal" onDifficulty={() => {}} onStart={() => {}} t={t} />);
  expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/panels.test.jsx`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement panel components and format helper**

Tailwind styling: dark wood-table gradient shell, gold/ivory accents, rounded-full pill HUDs, translucent panels, no external assets. Start panel shows title, one-line rules, three difficulty buttons and Start; disabled state visible. HUD shows opponent pill (count), center timer, player pill (count), turn message, power bar when dragging, sound toggle button. Result panel shows winner, restart and menu buttons. All text via `t(...)` keys listed in Task 7.

- [ ] **Step 4: Implement content.js**

State machine:
- `mode`: `'loading' | 'menu' | 'playing' | 'result'`.
- `busyRef`, `turnToken`, `deadlineRef`, `dragRef` store mutable loop state.
- Mount: create scene + audio in effect; load Rapier; cleanup scene/audio/timers. Do not create scene during SSR.
- Start: construct `new MatchEngine(rapier, { side: 'player' })`; `scene.syncPucks`; set counts; mode playing; `beginTurn('player')`.
- `beginTurn(side)`: set deadline `now + TURN_SECONDS*1000`, timer state, scene interactive side, turn message; increment token.
- Timer effect: interval 200 ms while playing; on expiry while player turn and not busy, cancel drag and `engine.passTurn('timeout')`, toast, beginTurn.
- Pointer handlers: `pointerdown` → if player turn/busy false → `scene.pickPuck`; require player half; snapshot start; `scene.beginDrag`; capture pointer. `pointermove` → `clampDragPoint`, store, scene update, set power. `pointerup` → if pull ≥ min → `fire('player', ...)`, else cancel. `pointercancel` cancels.
- `fire(side, puckId, dragPoint)`: set busy, clear drag, call `engine.shoot` in try/catch; `scene.playShot`; on done sync counts; if winner show result + audio.win; else `beginTurn(engine.currentSide)`, busy false.
- AI effect: when playing, currentSide opponent, not busy, mode playing → timeout 600 ms → `chooseShot` (seeded from turn+attempt); if skip → `engine.passTurn`, beginTurn; else `fire('opponent', ...)`. Cancel timeout on cleanup/unmount/restart.
- Restart: cancel timers, new engine/reset, sync, beginTurn. Menu: dispose current loop, mode menu.
- Debug hook when `process.env.NODE_ENV !== 'production'`: `window.__slingPuck = { getScreenPoint(id), hint(side), state(), forceTurnSide? no, setPlaybackRate(r), busy() }`; `hint` uses `chooseShot` with hard difficulty for the requested side, returns start and drag screen points plus `screenPoint` for the chosen puck, computed from scene. Remove on unmount.
- Layout: full-width shell with max width, tall canvas area, absolute HUD; canvas `touch-action-none`; responsive. Add help text strip below canvas with controls.
- Handle StrictMode double-effect safely (cancel flags).

- [ ] **Step 5: Run panel tests**

Run: `pnpm test -- --runTestsByPath src/app/\[lang\]/games/slingpuck/__tests__/panels.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/\[lang\]/games/slingpuck/content.js src/app/\[lang\]/games/slingpuck/components src/app/\[lang\]/games/slingpuck/ui src/app/\[lang\]/games/slingpuck/__tests__/panels.test.jsx
git commit -m "feat(slingpuck): add interactive game UI and AI loop"
```

---

### Task 7: Page, i18n, docs and gallery registration

**Files:**
- Create: `src/app/[lang]/games/slingpuck/page.js`
- Create: `src/app/[lang]/games/slingpuck/en.md`
- Create: `src/app/[lang]/games/slingpuck/zh.md`
- Create: `public/games/slingpuck/cover.jpeg` (initial cover; replaced by gameplay screenshot in Task 8 if available)
- Modify: `src/app/config/project.js` (add game card)
- Modify: `src/app/dictionaries/en.json`, `src/app/dictionaries/zh.json`

**Interfaces:**
- Consumes `SlingPuckGame` from `./content`.
- Dictionary keys: top-level `slingpuck_title`, `slingpuck_description`; UI keys `slingpuck_easy`, `slingpuck_normal`, `slingpuck_hard`, `slingpuck_start`, `slingpuck_loading`, `slingpuck_your_turn`, `slingpuck_ai_turn`, `slingpuck_thinking`, `slingpuck_timeout`, `slingpuck_you_win`, `slingpuck_ai_wins`, `slingpuck_restart`, `slingpuck_change_difficulty`, `slingpuck_power`, `slingpuck_player`, `slingpuck_ai`, `slingpuck_sound_on`, `slingpuck_sound_off`, `slingpuck_how_to`, `slingpuck_hint`, `slingpuck_opponent_count`, `slingpuck_player_count`; `seo.slingpuck` `{ title, description, keywords }`.

- [ ] **Step 1: Add dictionary entries**

Add the keys above to both JSON files with natural zh/en copy. Keep valid JSON (run `node -e "require('./src/app/dictionaries/en.json'); require('./src/app/dictionaries/zh.json')"`).

- [ ] **Step 2: Add the gallery card**

Append to `Projects.games`:

```js
{
  id: "slingpuck",
  title: "slingpuck_title",
  description: "slingpuck_description",
  image: "/games/slingpuck/cover.jpeg",
  link: "/games/slingpuck",
},
```

- [ ] **Step 3: Add page.js**

Mirror `gomoku/page.js`/`fruit/page.js` structure: `generateMetadata` from `dict.seo.slingpuck`, canonical/alternates for en/zh, `PageHeader` with `/games/slingpuck`, `<SlingPuckGame lang={lang} />`, `BlogMarkdown` for this directory, comments.

- [ ] **Step 4: Write en.md and zh.md**

Include: what the game is; controls (mouse/touch, drag toward your band, release); rules (5 each, colors don't matter, one shot per turn, settle then switch, empty your half, 30s timeout); difficulty descriptions; physics tips; FAQ. Use plain `##`/`###` headings, no frontmatter, in the same style as other game docs.

- [ ] **Step 5: Add cover**

Copy a placeholder reference image to `public/games/slingpuck/cover.jpeg` (portrait is acceptable; the card crops it). Task 8 replaces it with an actual gameplay screenshot when Playwright succeeds.

- [ ] **Step 6: Verify page generation and JSON**

Run: `node -e "require('./src/app/dictionaries/en.json'); require('./src/app/dictionaries/zh.json')"`
Expected: no output, exit 0.
Run: `pnpm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add "src/app/[lang]/games/slingpuck/page.js" "src/app/[lang]/games/slingpuck/en.md" "src/app/[lang]/games/slingpuck/zh.md" public/games/slingpuck/cover.jpeg src/app/config/project.js src/app/dictionaries/en.json src/app/dictionaries/zh.json
git commit -m "feat(slingpuck): register game page and gallery card"
```

---

### Task 8: Full verification, browser match, screenshots

**Files:**
- Modify (if needed): any fixes found by verification
- Create: `public/games/slingpuck/cover.jpeg` (replace with real gameplay screenshot)
- No committed test-only scripts required; use a temporary script outside the repo.

**Interfaces:**
- Uses dev-only `window.__slingPuck` hook: `{ getScreenPoint(id), hint(side), state(), setPlaybackRate(r), busy() }`.

- [ ] **Step 1: Run the full test suite and production build**

Run: `pnpm test`
Expected: all tests PASS, coverage generated.
Run: `pnpm build`
Expected: compile succeeds; `/{en,zh}/games/slingpuck` static output; no WASM/SSR errors.

- [ ] **Step 2: Start the dev server**

Run: `pnpm dev` in the background, wait for `http://localhost:3000/en/games/slingpuck` to respond. If port 3000 is in use, use `PORT=3010 pnpm dev`.

- [ ] **Step 3: Browser smoke test**

Use Playwright (install only if needed). Check:
- Page loads with the game canvas and Start panel; no console errors.
- Choose hard, start; canvas shows wooden board, 10 pucks, divider gap, two bands, HUD counts 5/5, timer.
- One real pointer drag from a player puck toward the player band fires a shot; animation plays; count/turn changes; collision sound code path is reached (no autoplay errors after start click).
- Tiny drag under minimum cancels without changing turn.
- Screenshot the board for visual review.

- [ ] **Step 4: Play a complete human-vs-AI match in two runs**

Script (Playwright):
1. Open page, select normal/hard, start.
2. Loop up to 40 player turns: wait until player's turn and not busy; call `window.__slingPuck.hint('player')`; dispatch mouse down/move/up between the returned canvas screen points; wait for busy false and either next player turn or result.
3. Let AI turns run automatically.
4. Assert a result panel appears with either win/lose text and both restart/menu buttons; click restart and assert a fresh 5/5 board.
5. Repeat once at a mobile viewport (e.g., 390×844) using touch/pointer events; assert no horizontal page overflow (`document.documentElement.scrollWidth <= innerWidth + 1`) and the board is fully visible.

If the match cannot finish within the cap, inspect state/turn and fix logic (do not skip the test).

- [ ] **Step 5: Capture cover and verify responsive screenshots**

Take a gameplay screenshot (game shell element or full page), save over `public/games/slingpuck/cover.jpeg` (or crop/pad to a wide cover if tooling exists). Take desktop and mobile screenshots into `.superpowers/` for review; inspect them and fix visual issues (board clipping, HUD overlap, oversized canvas, band not deforming, pucks invisible).

- [ ] **Step 6: Re-run tests and build after fixes**

Run: `pnpm test`
Expected: PASS.
Run: `pnpm build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/\[lang\]/games/slingpuck public/games/slingpuck src/app/config/project.js src/app/dictionaries
git commit -m "feat(slingpuck): verify full AI match and finalize visuals"
```

---

## Self-Review

- Spec coverage: board/visuals (Task 5), rules (Task 1, 3), physics/CCD/sound hooks (Task 2, 5), AI (Task 4), timer/timeout (Task 6), i18n/gallery/docs (Task 7), verification (Task 8).
- Review Focus tests: wrong-half/forward drag (Task 1 rules test), timeout mid-drag (Task 6 timer effect + unit passTurn test; browser smoke), wall/divider tunneling (Task 2 CCD/off-center tests), empty AI half (Task 4 skip test), stale shot on restart/unmount (Task 6 cleanup/turn token; browser restart check).
- Type consistency: `pucks` items always `{ id, x, y, angle, color }`; `side` always `'player' | 'opponent'`; `frames`/`events` shapes fixed in Task 2 and consumed unchanged in Task 5/6; `hint` returns canvas-relative screen points consumed by Task 8.
- No online package or server is added; the engine/AI boundaries remain reusable for future Colyseus integration.
