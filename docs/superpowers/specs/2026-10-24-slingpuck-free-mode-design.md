# Sling Puck free mode — design

**Date:** 2026-10-24
**Status:** proposed
**Related:** `2026-10-24-slingpuck-design.md` (turn-based mode), plan `2026-10-24-slingpuck.md`

## Intent

The shipped game is turn-based: one side shoots, the board is simulated to rest, then the other side shoots. Players asked for a speed contest: both sides hammer pucks at the same time, and the fun comes from how fast you can sling, not from waiting for the opponent.

Free mode adds a second way to play the same board, rules, rendering and AI. Turn-based mode is unchanged and stays the default.

## Decisions made by the player

- **AI rhythm:** fixed cadence by difficulty, not "simulate to rest, then shoot": Easy 1.8 s, Normal 1.2 s, Hard 0.7 s between shots.
- **Grabbing moving pucks:** only pucks *slower* than `PHYSICS.settleSpeed` (16 board units/s) can be picked up. Fast pucks cannot be grabbed.
- **Win condition:** a side wins as soon as its own half is empty. No time limit, no draw.
- **AI search cost:** free mode gives the AI a reduced search (fewer candidates, a 60–80 ms budget) instead of moving it to a worker, so each AI tick costs at most one short pause in the live loop.
- **Copy scope:** full — mode-specific how-to text in the start panel, a "自由模式 / Free mode" section in `en.md`/`zh.md`, and updated i18n strings for both languages.

## Goals

- Both sides can shoot concurrently at any time; the player can act again immediately after a release.
- Real-time physics: the board keeps simulating while pucks fly, and the next shot acts on the current positions.
- Same rules the turn mode states: only your own half's pucks, shots always launch toward the opponent.
- Same scene, audio, HUD, result panel, i18n and gallery card.

## Non-goals

- Online or two-human local play.
- Changing the turn-based mode's rules, timing or feel.
- Persistent best times, replays, or leaderboards.
- A separate cover image for free mode.

## Anti-goals

- A "free mode" that is still secretly waiting for the board to settle.
- A mode switch that leaks timers or AI callbacks into a restart/new game.
- Forking the rendering or AI code into a second copy that drifts.

## Constraints

- Next.js 14 App Router, JS, Three.js, Rapier 2D (0.21 compat), jest + jsdom.
- Rapier worlds are created per simulation today (`createWorld`); free mode needs a world that lives across shots.
- The existing AI search (`chooseShot`) simulates candidate shots in throwaway worlds; it must keep working on a snapshot of the live board.

## How it works

### Snapshot with velocity

`snapshotPucks` gains the live linear speed (board units/s) for each puck; `createWorld` gains an option to start bodies with that velocity so the AI's candidate simulations begin from the real moving board. Turn mode passes no velocities and behaves as before.

The AI search gets an optional grabbable predicate: only own-half pucks slower than `PHYSICS.settleSpeed` are candidates, while `scoreResult` still sees the full snapshot (no pre-filtering, so half counts and clear bonuses stay correct).

### Dragging a live puck

On pointer down in free mode the grabbed body is frozen in the live world (zero velocity, static for the duration of the drag). Release applies the impulse from that frozen origin. If the puck is knocked across the divider during the drag (possible when another puck collides with it), the drag is cancelled. `syncLive` skips the puck being dragged so its mesh follows the pointer instead of the physics.

### Winning moment

When a step leaves a half empty, the live loop stops immediately: no further steps, AI timer and player input are locked, any in-progress drag is cancelled, and the result panel shows over the frozen board. The winner path goes through the same generation token as restart/menu/unmount.

### New core: live match

`core/live.js` exports `LiveMatch`:

- Holds one long-lived Rapier world built with `createWorld(RAPIER, pucks)` at start.
- `step(frames)` advances the world by `frames × PHYSICS.fixedDt`, drains collision events for audio, and returns the snapshot (with speeds) plus events.
- `setFrozen(puckId, frozen)` freezes/thaws a body for dragging; `thawAll()` is used by reset/dispose.
- `shoot({ side, puckId, dragPoint })` validates ownership (puck in shooter's half, not the opponent's), that the puck is slower than `PHYSICS.settleSpeed`, that the pull is at least `PHYSICS.minPull`, then applies the launch velocity *immediately* to the live body. Throws on an illegal shot so the UI can ignore it.
- `counts` and `winner` are derived after every step: the first side whose half is empty wins. If both halves empty within the same step, the side that shot last wins.
- `reset()` and `free()` for restart and unmount.

### Rendering

The scene gains a live sync path: `scene.syncLive(snapshot)` places every puck from the physics snapshot each render frame, with the angle applied the same way as playback frames. Drag visuals, the band, the arrow and the power bar are reused unchanged.

### Player input (free mode)

- Pointer down picks only from pucks slower than `settleSpeed` (greyed/inert pick for fast pucks — no drag starts).
- Release fires immediately through `LiveMatch.shoot` when the pull is ≥ `minPull`; the drag visuals clear and the player can pick again in the same frame.
- No busy lock, no turn ownership check.

### AI (free mode)

- After its cadence elapses (tick cadence, measured from the previous tick's end; search time is included in the interval, not added to it), the AI takes a snapshot of the live board, runs `chooseShot` against it with the reduced free-mode search (`FREE_AI.search = { candidates: { easy: 4, normal: 8, hard: 14 }, budgetMs: 80 }`), and applies the chosen shot to the live world at once.
- If no puck in its half is slow enough or the search finds nothing legal, it skips that tick and retries at the next cadence.
- Cadence scales with difficulty: `FREE_AI.cadenceMs = { easy: 1800, normal: 1200, hard: 700 }`; cadence is tick-to-tick, and the search budget (≤ 80 ms) sits inside that interval.

### UI

- Start panel: a mode switch (回合制 / 自由模式) above or beside the difficulty row; difficulty still applies to both.
- HUD in free mode: hides the countdown and turn message; shows a "自由模式" label, both counts and the power bar. The "your turn / AI thinking" messages are not used.
- Result panel unchanged ("你赢了/AI 赢了", 再来一局, 更换难度). A restart starts a fresh live world with the same difficulty.

### Mode switch and lifecycle

- `gameMode` state (`"turns" | "free"`) chosen in the start panel; when it changes on the menu screen the state resets.
- Free mode's frame loop and AI timer are cancelled on restart, menu and unmount; a generation token guards any callback that might resolve late.

## Success tests

- `LiveMatch`: two shots in flight at once both change positions; a puck above `settleSpeed` cannot be shot by the player side; a shot from the wrong half throws; both halves emptied in one step awards the last shooter; reset restores 5/5.
- AI cadence: shots at ~1.8/1.2/0.7 s, skip when nothing is grabbable.
- UI: no countdown element in free mode; a second release mid-flight is accepted; restart/menu/unmount cancel the loop and timer.
- Browser: a full free-mode match on Edge at 1280×900 and 390×844 ends with the result panel; the board stays on-screen.

## Left to the builder

- The exact HUD layout for the mode label.
- Whether the live loop renders every physics step or every animation frame with an accumulator — either is fine as long as motion stays smooth at 60 Hz and shots are applied at the exact current position.
- Numeric feel tuning (cadence, launch impulse clamp) may be adjusted during verification if the Hard AI is unwinnable or trivial; changes go in the plan's tuning note.
