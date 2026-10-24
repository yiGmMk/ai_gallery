// Drives the real component's free-mode path: the live match, scene and AI are
// stubbed so each input branch and loop teardown can be observed exactly.
import { act, render } from '@testing-library/react';
import SlingPuckGame from '../content';
import { PHYSICS } from '../core/constants';
import { SlingPuckScene } from '../render/scene';

jest.mock('../core/physics', () => {
  const actual = jest.requireActual('../core/physics');
  return {
    ...actual,
    loadRapier: jest.fn(() => new Promise(resolve => setTimeout(() => resolve(actual.loadRapier()), 0))),
  };
});

jest.mock('../core/ai', () => {
  const actual = jest.requireActual('../core/ai');
  return { ...actual, chooseShot: jest.fn(() => ({ skip: true })) };
});

function makePucks() {
  const pucks = [];
  for (let id = 0; id < 10; id++) {
    const player = id < 5;
    pucks.push({ id, x: player ? -175 + id * 80 : -175 + (id - 5) * 80, y: player ? -245 : 245, angle: 0, color: player ? 'black' : 'ivory', speed: 0 });
  }
  return pucks;
}

const mockLiveInstances = [];
jest.mock('../core/live', () => {
  class MockLiveMatch {
    constructor() {
      MockLiveMatch.instances.push(this);
      this.pucks = makePucks();
      this.counts = { player: 5, opponent: 5 };
      this.speeds = {};
      this.frozenCalls = [];
      this.freeCalls = 0;
      this.thawCalls = 0;
      this.shoot = jest.fn(({ side, puckId, dragPoint }) => ({ side, puckId, dragPoint, power: 1, direction: { x: 0, y: 1 }, speed: 300 }));
      this.step = jest.fn(() => ({ pucks: this.pucks, counts: this.counts, winner: null, events: [] }));
      this.setFrozen = jest.fn((id, frozen) => { this.frozenCalls.push([id, frozen]); });
      this.thawAll = jest.fn(() => { this.thawCalls += 1; });
      this.free = jest.fn(() => { this.freeCalls += 1; });
    }
    puckSpeed(id) { return this.speeds[id] ?? 0; }
  }
  MockLiveMatch.instances = [];
  return { ...jest.requireActual('../core/live'), LiveMatch: MockLiveMatch };
});

jest.mock('../render/audio', () => ({
  SlingPuckAudio: jest.fn(() => ({
    setMuted: jest.fn(),
    unlock: jest.fn(),
    launch: jest.fn(),
    impact: jest.fn(),
    win: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock('../render/scene', () => {
  const actual = jest.requireActual('../render/scene');
  class MockScene {
    constructor() {
      MockScene.instances.push(this);
      this.liveModeCalls = [];
      this.cancelDrags = 0;
      this.beginDrags = 0;
    }
    setInteractiveSide() {}
    setLiveMode(on) { this.liveModeCalls.push(on); }
    syncLive(pucks) { this.lastLive = pucks; }
    syncPucks() {}
    pickPuck(clientX, clientY) { return this.pick?.(clientX, clientY) ?? null; }
    boardPoint() { return this.boardPointValue ?? { x: -175, y: -385 }; }
    beginDrag() { this.beginDrags += 1; }
    updateDrag() {}
    cancelDrag() { this.drawing = null; this.cancelDrags += 1; }
    cancelPlayback() {}
    setPlaybackRate() {}
    playShot() {}
    dispose() {}
  }
  MockScene.instances = [];
  return { ...actual, SlingPuckScene: MockScene };
});

jest.mock('@/app/i18n/client', () => ({
  useI18n: () => ({ t: key => key }),
}));

const latestScene = () => SlingPuckScene.instances[SlingPuckScene.instances.length - 1];
const latestLive = () => {
  const { LiveMatch } = jest.requireMock('../core/live');
  return LiveMatch.instances[LiveMatch.instances.length - 1];
};

const flushLoad = async () => {
  await act(async () => { jest.advanceTimersByTime(1); });
};

function startFreeGame() {
  act(() => { window.__slingPuck.setGameMode('free'); });
  const start = Array.from(document.querySelectorAll('button'))
    .find(button => button.textContent.includes('slingpuck_start'));
  act(() => { start.click(); });
  return latestScene();
}

function pointer(type, init = {}) {
  const canvas = document.querySelector('canvas');
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX: 0, clientY: 0, pointerId: 1, ...init });
  act(() => { canvas.dispatchEvent(event); });
  return event;
}

beforeAll(async () => {
  await jest.requireActual('../core/physics').loadRapier();
}, 30000);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  SlingPuckScene.instances.length = 0;
  jest.requireMock('../core/live').LiveMatch.instances.length = 0;
});

afterEach(() => {
  jest.useRealTimers();
});

test('free mode shows no countdown and accepts a second release while the first shot flies', async () => {
  render(<SlingPuckGame />);
  await flushLoad();
  const scene = startFreeGame();
  const live = latestLive();
  expect(document.body.textContent).not.toMatch(/\d:\d\d/);

  scene.pick = () => ({ id: 0 });
  pointer('pointerdown');
  pointer('pointermove');
  pointer('pointerup');
  expect(live.shoot).toHaveBeenCalledTimes(1);

  scene.pick = () => ({ id: 1 });
  pointer('pointerdown');
  pointer('pointermove');
  pointer('pointerup');
  expect(live.shoot).toHaveBeenCalledTimes(2);
  expect(live.shoot.mock.calls[1][0].puckId).toBe(1);
});

test('a fast puck cannot be grabbed', async () => {
  render(<SlingPuckGame />);
  await flushLoad();
  const scene = startFreeGame();
  const live = latestLive();
  live.speeds[0] = PHYSICS.settleSpeed + 1;

  scene.pick = () => ({ id: 0 });
  pointer('pointerdown');

  expect(live.setFrozen).not.toHaveBeenCalled();
  expect(scene.beginDrags).toBe(0);
});

test('a drag is cancelled when its puck crosses the divider', async () => {
  render(<SlingPuckGame />);
  await flushLoad();
  const scene = startFreeGame();
  const live = latestLive();

  scene.pick = () => ({ id: 0 });
  pointer('pointerdown');
  pointer('pointermove');
  live.pucks.find(puck => puck.id === 0).y = 100;
  pointer('pointerup');

  expect(live.shoot).not.toHaveBeenCalled();
  expect(live.frozenCalls).toEqual([[0, true], [0, false]]);
  expect(scene.cancelDrags).toBeGreaterThan(0);
});

test('leaving to the menu stops the loop and cancels the drag', async () => {
  render(<SlingPuckGame />);
  await flushLoad();
  const scene = startFreeGame();
  const live = latestLive();
  const cancel = jest.spyOn(window, 'cancelAnimationFrame');

  act(() => { window.__slingPuck.backToMenu(); });

  expect(live.thawAll).toHaveBeenCalled();
  expect(live.freeCalls).toBe(1);
  expect(scene.liveModeCalls).toContain(true);
  expect(scene.liveModeCalls[scene.liveModeCalls.length - 1]).toBe(false);
  expect(cancel).toHaveBeenCalled();
  expect(scene.cancelDrags).toBeGreaterThan(0);
  cancel.mockRestore();
});

const { chooseShot } = jest.requireMock('../core/ai');
const { FREE_AI, TURN_SECONDS } = jest.requireActual('../core/constants');

test('the AI fires on the difficulty cadence and skips ungrabbable boards', async () => {
  render(<SlingPuckGame />);
  await flushLoad();
  act(() => { window.__slingPuck.setGameMode('free'); });
  act(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('slingpuck_hard')).click();
  });
  const scene = startFreeGame();
  const live = latestLive();
  chooseShot.mockReturnValue({ puckId: 5, dragPoint: { x: 175, y: 385 }, power: 1, direction: { x: 0, y: -1 } });

  act(() => { jest.advanceTimersByTime(FREE_AI.cadenceMs.hard - 1); });
  expect(live.shoot).not.toHaveBeenCalled();
  act(() => { jest.advanceTimersByTime(1); });
  expect(live.shoot).toHaveBeenCalledTimes(1);
  expect(live.shoot.mock.calls[0][0].side).toBe('opponent');
  expect(chooseShot.mock.calls[0][0].config).toEqual({ candidates: FREE_AI.search.candidates.hard, budgetMs: FREE_AI.search.budgetMs });
  const grabbable = chooseShot.mock.calls[0][0].grabbable;
  expect(grabbable({ speed: PHYSICS.settleSpeed - 1 })).toBe(true);
  expect(grabbable({ speed: PHYSICS.settleSpeed })).toBe(false);

  act(() => { jest.advanceTimersByTime(FREE_AI.cadenceMs.hard); });
  expect(live.shoot).toHaveBeenCalledTimes(2);
  expect(scene.liveModeCalls).toContain(true);
});

test('a winner stops the loop, the AI timer and any drag, and shows the result', async () => {
  render(<SlingPuckGame />);
  await flushLoad();
  const scene = startFreeGame();
  const live = latestLive();
  const clear = jest.spyOn(window, 'clearTimeout');

  scene.pick = () => ({ id: 0 });
  pointer('pointerdown');
  pointer('pointermove');
  live.counts = { player: 0, opponent: 5 };
  live.step = jest.fn(() => ({ pucks: live.pucks, counts: live.counts, winner: 'player', events: [] }));
  act(() => { jest.advanceTimersByTime(50); });

  expect(window.__slingPuck.state().winner ?? 'player').toBe('player');
  expect(document.body.textContent).toContain('slingpuck_restart');
  expect(clear).toHaveBeenCalled();
  expect(live.thawAll).toHaveBeenCalled();
  expect(live.frozenCalls[live.frozenCalls.length - 1]).toEqual([0, false]);
  expect(scene.cancelDrags).toBeGreaterThan(0);
  expect(window.__slingPuck.state().mode).toBe('result');

  // Input and AI are locked after the result; the loop makes no further steps.
  const shots = live.shoot.mock.calls.length;
  const steps = live.step.mock.calls.length;
  pointer('pointerdown');
  pointer('pointermove');
  pointer('pointerup');
  act(() => { jest.advanceTimersByTime(5000); });
  expect(live.shoot.mock.calls.length).toBe(shots);
  expect(live.step.mock.calls.length).toBe(steps);
  clear.mockRestore();
});

test('restart from the result screen starts a fresh 5/5 free game', async () => {
  render(<SlingPuckGame />);
  await flushLoad();
  const scene = startFreeGame();
  const first = latestLive();
  first.counts = { player: 0, opponent: 5 };
  first.step = jest.fn(() => ({ pucks: first.pucks, counts: first.counts, winner: 'player', events: [] }));
  act(() => { jest.advanceTimersByTime(50); });

  act(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('slingpuck_restart')).click();
  });
  const second = latestLive();
  expect(second).not.toBe(first);
  expect(first.freeCalls).toBe(1);
  const state = window.__slingPuck.state();
  expect(state.mode).toBe('playing');
  expect(state.gameMode).toBe('free');
  expect(state.counts).toEqual({ player: 5, opponent: 5 });
  expect(liveThawedMode(scene)).toBe(true);
});

test('unmount cancels the loop and AI timer', async () => {
  const { unmount } = render(<SlingPuckGame />);
  await flushLoad();
  startFreeGame();
  const live = latestLive();
  chooseShot.mockClear();

  unmount();
  await act(async () => { jest.advanceTimersByTime(5000); });

  expect(chooseShot).not.toHaveBeenCalled();
  expect(live.freeCalls).toBe(1);
});

function liveThawedMode(scene) {
  const calls = scene.liveModeCalls;
  return calls[calls.length - 1] === true;
}
