import * as THREE from 'three';
import { SlingPuckScene } from '../render/scene';
import { PHYSICS } from '../core/constants';

// Prototype-only instance (no WebGL), with fake views that record placements.
function fakeView(id, placements) {
  return {
    group: { position: { set(x, y, z) { placements[id] = { x, y, z }; } }, rotation: new THREE.Group().rotation },
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
  scene.puckMeshes = [];
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
  expect(scene.lastPucks.find(p => p.id === 1)).toBeDefined();
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

test('turn mode glow stays keyed to the interactive side after a live match', () => {
  const snapshot = [
    { id: 0, x: 0, y: -200, angle: 0, color: 'black', speed: 0 },
    { id: 2, x: 0, y: 200, angle: 0, color: 'black', speed: 0 },
  ];
  const { scene } = fakeScene(snapshot);
  scene.setLiveMode(true);
  scene.syncLive(snapshot);
  scene.setLiveMode(false);
  scene.setInteractiveSide('opponent');
  expect(scene.views.get(0).glow.visible).toBe(false);
  expect(scene.views.get(2).glow.visible).toBe(true);
});
