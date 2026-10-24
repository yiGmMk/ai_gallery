# Sling Puck Free Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a free (speed-contest) mode where both sides sling pucks continuously with no turns, leaving turn-based mode unchanged.

**Architecture:** A new `LiveMatch` (`core/live.js`) owns one long-lived Rapier world stepped from a `requestAnimationFrame` loop; shots apply impulses to live bodies immediately. Snapshots gain per-puck speed, the AI search gains a grabbable predicate and reduced budget, the scene gains `syncLive`, and `content.js` gains a `gameMode` branch with its own loop, input and AI cadence.

**Tech Stack:** Next.js 14 App Router (JS), React 18, Three.js, Rapier 2D (`@dimforge/rapier2d-compat` 0.21), Jest + jsdom + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-10-24-slingpuck-free-mode-design.md` (binding). Turn-mode design: `docs/superpowers/specs/2026-10-24-slingpuck-design.md`.

## Global Constraints

- Turn-based mode behavior and its tests stay unchanged; it remains the default.
- Free mode never waits for the board to settle and never alternates turns.
- Only own-half pucks slower than `PHYSICS.settleSpeed` (16 board units/s) are grabbable or shootable.
- AI cadence: easy 1800, normal 1200, hard 700 ms, tick-to-tick; search (≤ 80 ms) sits inside the interval.
- AI free-mode search: candidate caps easy 4 / normal 8 / hard 14; budget 80 ms; scoring always sees the full snapshot.
- Winner is the first side whose half empties; both empty in one step → the last shooter wins.
- On a winner the loop stops immediately, input and AI lock, drags cancel, and the result panel shows.
- Per-task test command: `pnpm exec jest --runTestsByPath "<path>" --coverage=false`; final gate `pnpm test` and `pnpm build`.
- Code style matches the existing game modules (ES modules, named exports, comments only for non-obvious decisions).

## Review Focus

- A fast-flying puck must never be grabbed, even when the pointer lands on it (checked at pointer down against live speed).
- A grabbed puck knocked across the divider during its drag must cancel that drag, never fire from the opponent's half.
- A shot fired while another puck is mid-flight must act on the current live position, not a stale cached one.
- Restart, menu, unmount or a winner while the loop/AI/drag are live must leave no loop, timer or drag alive, and no stale callback may mutate the next game.
- A free match must always terminate: the AI never shoots a fast puck and no side is left permanently unshootable.

---

### Task 1: Constants, snapshot speed, and the live match

**Files:**
- Modify: `src/app/[lang]/games/slingpuck/core/constants.js` (add `FREE_AI` after `AI_SEARCH`)
- Modify: `src/app/[lang]/games/slingpuck/core/physics.js` (`snapshotPucks` gains `speed`)
- Create: `src/app/[lang]/games/slingpuck/core/live.js`
- Test: `src/app/[lang]/games/slingpuck/__tests__/live.test.js` (new), `__tests__/physics.test.js` (one added test)

**Interfaces:**
- Consumes: `createWorld`, `snapshotPucks` (`core/physics.js`); `clampDragPoint`, `computeShot`, `sideOfPuck`, `countPucks`, `initialPucks` (`core/rules.js`); `PHYSICS`.
- Produces:
  - `FREE_AI` = `{ cadenceMs: { easy: 1800, normal: 1200, hard: 700 }, search: { candidates: { easy: 4, normal: 8, hard: 14 }, budgetMs: 80 } }` (frozen).
  - `snapshotPucks(bodies, pucks)` items gain `speed` (board units/s).
  - `new LiveMatch(rapier, { pucks = initialPucks() } = {})` with:
    - `get pucks()` → `{ id, x, y, angle, color, speed }[]`
    - `get counts()` → `{ player, opponent }`
    - `get winner()` / `get lastShooter()` → `null | side`
    - `step(frames = 1)` → `{ pucks, counts, winner, events }`; no-op once a winner exists
    - `shoot({ side, puckId, dragPoint })` → `{ puckId, side, power, direction, speed }`; throws `"Game is over"`, `` `Not ${side}'s half` ``, `"Puck is frozen"`, `"Puck is moving too fast"`, `"Pull is too short"` in that order
    - `puckSpeed(id)` → number
    - `setFrozen(puckId, frozen)`, `thawAll()`
    - `reset()` → frees and rebuilds the world at 5/5, clears winner/lastShooter
    - `free()` → frees world + event queue

- [ ] **Step 1: Write the failing tests**

`__tests__/physics.test.js`:

```js
test('snapshots carry each puck\'s live speed in board units', () => {
  const result = simulateShot(RAPIER, [puck(0, 0, -260)], {
    puckId: 0, side: 'player', dragPoint: { x: 0, y: -430 },
  });
  expect(result.frames[0].pucks[0].speed).toBeGreaterThan(0);
  expect(result.pucks[0].speed).toBeLessThan(PHYSICS.settleSpeed + 1);
});
```

`__tests__/live.test.js`:

```js
import { loadRapier } from '../core/physics';
import { LiveMatch } from '../core/live';
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
  const match = new LiveMatch(RAPIER, {
    pucks: [
      { id: 0, x: -40, y: -120, angle: 0, color: 'black' },
      { id: 1, x: 40, y: 120, angle: 0, color: 'ivory' },
    ],
  });
  match.shoot({ side: 'player', puckId: 0, dragPoint: { x: -40, y: -290 } });
  match.shoot({ side: 'opponent', puckId: 1, dragPoint: { x: 40, y: 290 } });
  for (let i = 0; i < 60 && !match.winner; i++) match.step(1);
  expect(match.counts).toEqual({ player: 0, opponent: 0 });
  expect(match.winner).toBe('opponent');
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec jest --runTestsByPath "src/app/[lang]/games/slingpuck/__tests__/live.test.js" "src/app/[lang]/games/slingpuck/__tests__/physics.test.js" --coverage=false`
Expected: FAIL — missing `../core/live`, `FREE_AI` undefined, `speed` undefined.

- [ ] **Step 3: Implement**

`FREE_AI` exactly as in Interfaces. `snapshotPucks` adds `speed: Math.hypot(body.linvel().x, body.linvel().y) / PHYSICS.worldScale`.

`LiveMatch` keeps `{ world, bodies, colliderMeta, eventQueue }` from `createWorld`, plus `meta` (id/color per index), `puckIds`, `frozen` Set, `lastShooter`, `winningSide`. `step` loops `world.step(eventQueue)`, drains collision-start events into `{ frame, type, strength, x, y }` (same fields as `physics.js`'s `collectEvents`), updates counts/winner (half empty → that side; both → `lastShooter`), then returns. `shoot` performs the validation chain, computes `computeShot`, applies `setLinvel`, records `lastShooter`. `setFrozen` switches `RigidBodyType.Fixed` / `Dynamic`, zeroing velocity on thaw. `reset` frees the old world/event queue and builds a new one; `free` does the same without rebuilding. Guard `step`/`shoot` after `free()`.

- [ ] **Step 4: Run tests to verify they pass**

Run the same two paths. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/[lang]/games/slingpuck/core/constants.js src/app/[lang]/games/slingpuck/core/physics.js src/app/[lang]/games/slingpuck/core/live.js src/app/[lang]/games/slingpuck/__tests__/live.test.js src/app/[lang]/games/slingpuck/__tests__/physics.test.js
git commit -m "feat(slingpuck): add free-mode constants and LiveMatch engine"
```

---

### Task 2: Velocity-aware world creation and a grabbable AI filter

**Files:**
- Modify: `src/app/[lang]/games/slingpuck/core/physics.js` (`createWorld`)
- Modify: `src/app/[lang]/games/slingpuck/core/ai.js` (`chooseShot`)
- Modify: `src/app/[lang]/games/slingpuck/core/live.js` (snapshot carries `vx`/`vy`)
- Test: `__tests__/physics.test.js`, `__tests__/ai.test.js`

**Interfaces:**
- Produces:
  - `createWorld(RAPIER, pucks)` applies `vx`/`vy` (board units/s) to any puck that carries them.
  - `simulateShot` therefore starts candidate worlds from moving boards when given moving snapshots; existing callers pass no velocities and are unchanged.
  - `chooseShot({ ..., grabbable = () => true, config: configOverride })`:
    - merged config is `{ ...(DIFFICULTIES[difficulty] ?? DIFFICULTIES.normal), ...(configOverride ?? {}) }`, so `angleSigma`, `topPool`, `pickCount` survive a candidate-only override;
    - `budgetMs` comes from the merged config (fallback `AI_SEARCH.budgetMs`);
    - own pucks for which `grabbable(puck)` is false are skipped as candidates, but `scoreResult` still receives all `pucks`.
  - `LiveMatch.pucks` items gain `vx`/`vy` (board units/s) alongside `speed`. `createWorld` ignores velocities for turn-mode and AI candidate worlds that pass none.

- [ ] **Step 1: Write the failing tests**

`__tests__/physics.test.js`:

```js
test('a world built from moving pucks starts them at that velocity', () => {
  const moving = { id: 0, x: 0, y: -260, angle: 0, color: 'black', vx: 0, vy: 900 };
  const result = simulateShot(RAPIER, [moving], { puckId: 0, velocity: { x: 0, y: 0 } }, { maxTime: 0.2 });
  expect(result.pucks[0].y).toBeGreaterThan(-260 + 100);
});
```

`__tests__/ai.test.js`:

```js
test('non-grabbable pucks are not candidates but scoring uses the full board', () => {
  const pucks = initialPucks();
  const choice = chooseShot({
    rapier: RAPIER, pucks, side: 'player', difficulty: 'hard', rng: seededRng(9), now: noBudget,
    grabbable: puck => puck.id !== 0,
    config: { candidates: 14, budgetMs: 80 },
  });
  expect(choice.puckId).not.toBe(0);
  expect(choice.candidatesChecked).toBe(14);
  expect(choice.score).toBeDefined();
});

test('a config override keeps the difficulty error model', () => {
  const choice = chooseShot({
    rapier: RAPIER, pucks: initialPucks(), side: 'player', difficulty: 'easy', rng: seededRng(2), now: noBudget,
    config: { candidates: 4, budgetMs: 80 },
  });
  expect(Number.isFinite(choice.power)).toBe(true);
  expect(choice.candidatesChecked).toBeLessThanOrEqual(4);
});

test('the search budget from the merged config stops the loop', () => {
  let calls = 0;
  const choice = chooseShot({
    rapier: RAPIER, pucks: initialPucks(), side: 'player', difficulty: 'hard', rng: seededRng(2),
    now: () => (calls++ >= 3 ? 100 : 0),
    config: { candidates: 14, budgetMs: 80 },
  });
  expect(choice.candidatesChecked).toBeLessThanOrEqual(4);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run both test paths. Expected: FAIL — no displacement, excluded puck selected, budget ignored, or NaN power.

- [ ] **Step 3: Implement**

In `createWorld`, after creating each body: `if (puck.vx || puck.vy) body.setLinvel({ x: (puck.vx ?? 0) * scale, y: (puck.vy ?? 0) * scale }, false);`. In `chooseShot`, rename the parameter to `config: configOverride = null`, merge as above, use `budgetMs = config.budgetMs ?? AI_SEARCH.budgetMs`, and skip `!grabbable(puck)` in the own-puck loop. `LiveMatch` snapshot adds `vx`/`vy` from `body.linvel()`.

- [ ] **Step 4: Run tests to verify they pass**

Run `physics.test.js`, `ai.test.js`, `live.test.js`, then `pnpm test`. Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/app/[lang]/games/slingpuck/core src/app/[lang]/games/slingpuck/__tests__
git commit -m "feat(slingpuck): velocity-aware worlds and grabbable AI candidates"
```

---

### Task 3: Live scene sync and grabbable glow

**Files:**
- Modify: `src/app/[lang]/games/slingpuck/render/scene.js`
- Test: `src/app/[lang]/games/slingpuck/__tests__/scene-live.test.js` (new)

**Interfaces:**
- Produces:
  - `scene.syncLive(snapshot, { skipId = null } = {})` places every puck like `syncPucks` but skips `skipId`, and updates `lastPucks`.
  - `scene.setLiveMode(on)`; when on, `applyGlow` shows glow only for pucks with `y < 0 && speed < PHYSICS.settleSpeed`, independent of `interactiveSide`.
  - Existing `syncPucks`, `applyGlow`, `setInteractiveSide` behavior unchanged when live mode is off.

- [ ] **Step 1: Write the failing test**

Prototype-only instance (no WebGL), with fake views that record placements:

```js
import { SlingPuckScene } from '../render/scene';
import { PHYSICS } from '../core/constants';

function fakeView(id, placements) {
  return {
    group: { position: { set(x, y, z) { placements[id] = { x, y, z }; } }, rotation: {} },
    glow: { visible: false },
    angle: 0,
  };
}
function fakeScene(pucks) {
  const scene = Object.create(SlingPuckScene.prototype);
  const placements = {};
  scene.views = new Map(pucks.map(p => [p.id, fakeView(p.id, placements)]));
  scene.lastPucks = [];
  scene.interactiveSide = 'player';
  return { scene, placements };
}

test('live sync skips the dragged puck and applies angles', () => {
  const snapshot = [
    { id: 0, x: 0, y: -200, angle: 0.5, color: 'black', speed: 0 },
    { id: 1, x: 100, y: 200, angle: 1, color: 'ivory', speed: 0 },
  ];
  const { scene, placements } = fakeScene(snapshot);
  scene.syncLive(snapshot, { skipId: 1 });
  expect(placements[0]).toBeDefined();
  expect(placements[1]).toBeUndefined();
  expect(scene.views.get(0).group.rotation.y).toBe(-0.5);
});

test('live mode glows only slow player pucks', () => {
  const snapshot = [
    { id: 0, x: 0, y: -200, angle: 0, color: 'black', speed: 0 },
    { id: 1, x: 100, y: -100, angle: 0, color: 'ivory', speed: PHYSICS.settleSpeed + 50 },
    { id: 2, x: 0, y: 200, angle: 0, color: 'black', speed: 0 },
  ];
  const { scene } = fakeScene(snapshot);
  scene.setLiveMode(true);
  scene.syncLive(snapshot);
  expect(scene.views.get(0).glow.visible).toBe(true);
  expect(scene.views.get(1).glow.visible).toBe(false);
  expect(scene.views.get(2).glow.visible).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails** — `syncLive is not a function`.

- [ ] **Step 3: Implement**

Extract a private `placeView(view, puck)` used by both `syncPucks` and `syncLive`; `syncLive` loops the snapshot, skipping `skipId`, then `applyGlow()`. Add `this.liveMode = false` in `setLiveMode`; branch `applyGlow`.

- [ ] **Step 4: Run test to verify it passes** plus `scene-band.test.js`. Expected: PASS.

- [ ] **Step 5: Commit** `feat(slingpuck): live snapshot sync and grabbable glow`

---

### Task 4: Free-mode loop and player input

**Files:**
- Modify: `src/app/[lang]/games/slingpuck/content.js`
- Test: `src/app/[lang]/games/slingpuck/__tests__/free-mode.test.jsx` (new; same module-mocking pattern as `game-lifecycle.test.jsx`)

**Interfaces:**
- Consumes: `LiveMatch`, `FREE_AI`, `syncLive`, `setLiveMode`, `createFrameQueue`.
- Produces (state/refs in `content.js`):
  - `const [gameMode, setGameMode] = useState("turns")`
  - `liveRef`, `liveTokenRef`, `liveFrameRef` (rAF id), `liveAccRef`
  - `startGame()` branches on `gameMode`; for free mode it creates `new LiveMatch(rapier)`, `scene.setLiveMode(true)`, `scene.syncLive(...)`, `setMode("playing")`
  - loop effect keyed `[mode, gameMode]`: on each rAF compute `delta = min(100, now - last)`, `steps = floor((acc + delta) / (PHYSICS.fixedDt * 1000))`, `live.step(steps)`, `scene.syncLive(live.pucks, { skipId: dragRef.current?.puckId })`, then check winner (Task 5) and request the next frame; cleanup cancels the frame, thaws all, `setLiveMode(false)`
  - pointer down (free): pick → `sideOfPuck === "player"` → `live.puckSpeed(id) < PHYSICS.settleSpeed` → `live.setFrozen(id, true)`, `scene.beginDrag`, drag state as today; otherwise no drag
  - pointer move (free): same clamp/queue path
  - cross-divider check: before firing, look up the dragged id in `live.pucks`; if its `y >= 0`, thaw and cancel instead of shooting
  - release (free): if the live puck is now on the opponent's half or `pending` is null → cancel; else `live.setFrozen(id, false)` and `live.shoot({ side: "player", puckId, dragPoint })` guarded by try/catch; then `scene.cancelDrag()`
  - pointer cancel: thaw + cancel
- Turn mode paths (`engineRef`, `fire`, timers) unchanged.

- [ ] **Step 1: Write the failing tests**

LiveMatch is mocked (constructor returns an object with spies), scene/audio/i18n as in the lifecycle harness. Key tests:

```jsx
test('free mode shows no countdown and accepts a second release while the first shot flies', () => {
  // start free; expect no /\d:\d\d/ text
  // pointerdown/up with a legal pull -> live.shoot called once
  // immediately pointerdown on another slow puck and release -> called twice
});
test('a fast puck cannot be grabbed', () => {
  // live.puckSpeed returns settleSpeed + 1; pointerdown over it -> no live.setFrozen, no beginDrag
});
test('a drag is cancelled when its puck crosses the divider', () => {
  // start a drag, then live.pucks reports the dragged id with y > 0; pointerup -> no shoot, frozen thawed
});
test('leaving to the menu stops the loop and cancels the drag', () => {
  // start free; spy cancelAnimationFrame; backToMenu(); expect scene.setLiveMode(false), live.free called, drag cancelled
});
```

- [ ] **Step 2: Run tests to verify they fail** — free mode isn't selectable and behaves as turn mode (countdown appears, fast puck is grabbed).

- [ ] **Step 3: Implement** the branch as specified. Keep every turn-mode block untouched behind `gameMode === "turns"` checks or separate callbacks.

- [ ] **Step 4: Run new tests plus `game-lifecycle.test.jsx` and the full suite. Expected: green.**

- [ ] **Step 5: Commit** `feat(slingpuck): free-mode live loop and player input`

---

### Task 5: Free-mode AI cadence, winner handling and lifecycle

**Files:**
- Modify: `src/app/[lang]/games/slingpuck/content.js`
- Modify: `src/app/[lang]/games/slingpuck/core/live.js` (only if Task 1 missed the winner-freeze guard)
- Test: `__tests__/free-mode.test.jsx`

**Interfaces:**
- Produces:
  - `aiTimerRef`; an effect keyed `[mode, gameMode, difficulty, liveToken]` arms `setTimeout(FREE_AI.cadenceMs[difficulty])`; each tick:
    - `chooseShot({ rapier, pucks: live.pucks, side: "opponent", difficulty, rng: seededRng(liveToken * 7919 + tick), grabbable: p => p.speed < PHYSICS.settleSpeed, config: { candidates: FREE_AI.search.candidates[difficulty], budgetMs: FREE_AI.search.budgetMs } })`
    - skip → re-arm; legal choice → `live.shoot(...)`; a thrown shoot → re-arm; always re-arm while no winner
  - winner path (shared by loop): `liveTokenRef.current += 1`, cancel rAF and AI timer, `dragFrameRef.clear()`, thaw all, `scene.cancelDrag()`, `setWinner`, `setMode("result")`, `audio.win()`
  - `window.__slingPuck.autoShot(side)` (dev only): choose a hard shot on the current live board for `side` (grabbable filter) and `live.shoot` it; returns the shot or `{ skip: true }` — used by the browser harness to finish a free match
  - `window.__slingPuck.state()` gains `gameMode`

- [ ] **Step 1: Write the failing tests**

```jsx
test('the AI fires on the difficulty cadence and skips ungrabbable boards', () => {
  // free + hard; advance 700 -> live.shoot once; advance 700 -> twice
  // chooseShot skip variant -> no shoot, timer keeps re-arming
});
test('a winner stops the loop, the AI timer and any drag, and shows the result', () => {
  // live.step returns winner after 3 calls; expect cancelAnimationFrame, clearTimeout, scene.cancelDrag, result text
});
test('restart from the result screen starts a fresh 5/5 free game', () => {
  // click Play again; expect new LiveMatch, counts 5/5, gameMode free
});
test('unmount cancels the loop and AI timer', () => {
  // unmount while free playing; advance 5000; chooseShot not called again, live.free called
});
```

- [ ] **Step 2: Run tests to verify they fail** — no AI timer, winner not handled.

- [ ] **Step 3: Implement** the timer, winner path, `autoShot`, and `state().gameMode`.

- [ ] **Step 4: Run tests plus the full suite. Expected: green.**

- [ ] **Step 5: Commit** `feat(slingpuck): free-mode AI cadence and winner lifecycle`

---

### Task 6: Start-panel mode switch, HUD, hints and i18n

**Files:**
- Modify: `components/StartPanel.js`, `components/GameHud.js`, `content.js`, `__tests__/panels.test.jsx`
- Modify: `src/app/dictionaries/en.json`, `zh.json`

**Interfaces:**
- New keys (en / zh): `slingpuck_mode_turns` (Turn-based / 回合制), `slingpuck_mode_free` (Free mode / 自由模式), `slingpuck_how_to_free` (free-mode how-to), `slingpuck_free_label` (Free mode / 自由模式), `slingpuck_free_hint` (free-mode hint strip).
- `StartPanel({ gameMode, onGameMode, ... })`: two aria-pressed buttons; how-to text switches.
- `GameHud({ gameMode, ... })`: free mode renders a `slingpuck_free_label` pill and no clock/message; counts and power bar remain.
- `content.js` passes `gameMode` to both, and the under-board hint picks `slingpuck_free_hint` in free mode.

- [ ] **Step 1: Write failing panel tests** — mode buttons with aria-pressed; how-to switches; HUD has no clock text and shows the free label.
- [ ] **Step 2: Run to verify fail.**
- [ ] **Step 3: Implement** panels, props, and dictionary keys.
- [ ] **Step 4: Run panels + full suite. Expected: green.**
- [ ] **Step 5: Commit** `feat(slingpuck): free-mode switch, HUD and copy`

---

### Task 7: Page docs, SEO copy, and browser verification

**Files:**
- Modify: `src/app/[lang]/games/slingpuck/en.md`, `zh.md`
- Modify: `src/app/dictionaries/en.json`, `zh.json` (SEO description/keywords mention free mode)
- Create: `/mnt/c/Users/Public/slingpuck-verify/free.cjs` (Windows-side harness)

**Interfaces:**
- Docs: a "Free mode / 自由模式" section stating no turns, slow-puck grab rule, AI cadence by difficulty, first clear wins.
- Harness: Edge headless via Windows node; URL from `WSLENV`; picks free mode + Hard, starts, loops `autoShot('player')` every 400 ms until `state().winner`, screenshots `free-start.png`, `free-result.png` at 1280×900 and (MOBILE=1) 390×844; asserts board fully visible, no horizontal overflow, console errors only from the known site-wide hydration/giscus noise.
- Dev hook `autoShot` is stripped from production builds by the existing `NODE_ENV` guard.

- [ ] **Step 1: Write docs/SEO.**
- [ ] **Step 2: Run `pnpm test` and `pnpm build`; Expected green/compiled.**
- [ ] **Step 3: Start a fresh dev server on an unused port; run the harness for desktop and mobile; Expected: result panel in both, board fully visible, no overflow.**
- [ ] **Step 4: Commit** `feat(slingpuck): document free mode and verify it in the browser`
