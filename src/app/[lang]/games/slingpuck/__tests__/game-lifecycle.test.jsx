// Drives the real SlingPuckGame component through the lifecycle paths the plan's
// Review Focus names, with the scene, physics engine and AI candidate search
// stubbed so each timer and callback can be observed exactly.
import { act, render } from '@testing-library/react';
import SlingPuckGame from '../content';
import { loadRapier } from '../core/physics';
import { chooseShot, seededRng } from '../core/ai';
import { SlingPuckScene } from '../render/scene';
import { SlingPuckAudio } from '../render/audio';

jest.mock('../core/physics', () => {
  const actual = jest.requireActual('../core/physics');
  // Resolve through the real WASM init on the next macrotask rather than
  // returning an already-resolved promise.
  return {
    ...actual,
    loadRapier: jest.fn(() => new Promise(resolve => setTimeout(() => resolve(actual.loadRapier()), 0))),
  };
});

jest.mock('../core/ai', () => {
  const actual = jest.requireActual('../core/ai');
  return { ...actual, chooseShot: jest.fn(() => ({ skip: true })) };
});

jest.mock('../render/audio', () => ({
  SlingPuckAudio: jest.fn(() => ({
    setMuted: jest.fn(),
    unlock: jest.fn(),
    launch: jest.fn(),
    win: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock('../render/scene', () => {
  const actual = jest.requireActual('../render/scene');
  // A per-instance scene stub that records drags and defers playback until the
  // test calls finishPlayback(), which is what lets a stale callback be fired
  // after the game has already been reset.
  class MockScene {
    constructor() {
      MockScene.instances.push(this);
      this.lastPucks = [];
      this.drags = [];
      this.cancelled = 0;
      this.cancelDrags = 0;
    }
    setInteractiveSide() {}
    syncPucks(pucks) { this.lastPucks = pucks.map(puck => ({ ...puck })); }
    pickPuck(clientX, clientY) { return this.pick?.(clientX, clientY) ?? null; }
    boardPoint() { return { x: 0, y: 0 }; }
    beginDrag(id) { this.drawing = id; }
    updateDrag(drag) { this.drags.push(drag); }
    cancelDrag() { this.drawing = null; this.cancelDrags += 1; }
    playShot({ onDone }) { this.pending = onDone; }
    finishPlayback() {
      const onDone = this.pending;
      this.pending = null;
      onDone?.();
    }
    cancelPlayback() { this.cancelled += 1; }
    setPlaybackRate() {}
    dispose() {}
  }
  MockScene.instances = [];
  return { ...actual, SlingPuckScene: MockScene };
});

jest.mock('@/app/i18n/client', () => ({
  useI18n: () => ({ t: key => key }),
}));

const latestScene = () => SlingPuckScene.instances[SlingPuckScene.instances.length - 1];
// Runs the mocked loadRapier's deferred resolution under the fake clock.
const flushLoad = async () => {
  await act(async () => { jest.advanceTimersByTime(1); });
};

function primeScene(scene) {
  scene.pick = () => ({ id: 0 });
  // 140 units backward from puck 0 at (-175, -245): a legal full pull.
  scene.boardPoint = () => ({ x: -175, y: -385 });
  return scene;
}

function startGame() {
  const buttons = Array.from(document.querySelectorAll('button'));
  const start = buttons.find(button => button.textContent.includes('slingpuck_start'));
  act(() => { start.click(); });
}

function pointer(type, init = {}) {
  const canvas = document.querySelector('canvas');
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX: 0, clientY: 0, pointerId: 1, ...init });
  act(() => { canvas.dispatchEvent(event); });
  return event;
}

// Warm the real WASM before any test installs fake timers.
beforeAll(async () => {
  await jest.requireActual('../core/physics').loadRapier();
}, 30000);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  SlingPuckScene.instances.length = 0;
});

afterEach(() => {
  jest.useRealTimers();
});

test('a timeout while the player is mid-drag cancels the drag and passes the turn without a shot', async () => {
  render(<SlingPuckGame />);
  await flushLoad();
  startGame();
  const scene = primeScene(latestScene());

  pointer('pointerdown', { clientX: 10, clientY: 10 });
  pointer('pointermove', { clientX: -20, clientY: 60 });
  // 30s deadline plus a 200ms tick, then the deferred release must do nothing.
  act(() => { jest.advanceTimersByTime(30200); });
  expect(scene.cancelDrags).toBeGreaterThan(0);
  const side = window.__slingPuck.state().side;
  expect(side).toBe('opponent');

  pointer('pointerup');
  expect(scene.pending).toBeUndefined();

  // Let the queued AI turn resolve through its empty-half skip.
  await act(async () => { jest.advanceTimersByTime(700); });
  expect(window.__slingPuck.state().side).toBe('player');
});

test('a release after a pointermove the scene cannot map never launches a stale pull', async () => {
  render(<SlingPuckGame />);
  await flushLoad();
  startGame();
  const scene = primeScene(latestScene());
  const mapping = { ok: true };
  scene.boardPoint = () => (mapping.ok ? { x: -175, y: -385 } : null);

  pointer('pointerdown');
  pointer('pointermove'); // accepted backward pull
  mapping.ok = false;
  pointer('pointermove'); // out of bounds: must clear the pending pull
  pointer('pointerup');

  expect(scene.pending).toBeUndefined();
  expect(chooseShot).not.toHaveBeenCalled();
  expect(window.__slingPuck.state().turn).toBe(1);
});

test('a stale playback completion after a new game is started is ignored', async () => {
  const { unmount } = render(<SlingPuckGame />);
  await flushLoad();
  startGame();
  const oldScene = primeScene(latestScene());

  pointer('pointerdown');
  pointer('pointermove', { clientX: -20, clientY: 60 });
  pointer('pointerup');
  expect(oldScene.pending).toBeInstanceOf(Function);

  // Leave the game and start a new one while the first shot still "plays".
  act(() => { window.__slingPuck.backToMenu(); });
  startGame();

  act(() => { oldScene.finishPlayback(); });
  const after = window.__slingPuck.state();
  expect(after.mode).toBe('playing');
  expect(after.turn).toBe(1);
  expect(after.side).toBe('player');
  expect(after.counts).toEqual({ player: 5, opponent: 5 });
  unmount();
});

test('unmounting cancels the pending AI turn so it never fires', async () => {
  const { unmount } = render(<SlingPuckGame />);
  await flushLoad();
  startGame();
  const scene = primeScene(latestScene());

  pointer('pointerdown');
  pointer('pointermove', { clientX: -20, clientY: 60 });
  pointer('pointerup');
  act(() => { scene.finishPlayback(); });
  expect(window.__slingPuck.state().side).toBe('opponent');

  unmount();
  await act(async () => { jest.advanceTimersByTime(2000); });
  expect(chooseShot).not.toHaveBeenCalled();
});
