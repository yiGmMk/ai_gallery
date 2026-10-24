import * as THREE from 'three';
import { SlingPuckScene } from '../render/scene';

// The scene constructor needs a WebGL renderer, so these tests exercise the
// band bookkeeping on a prototype-only instance: exactly the part that runs on
// every pointer move.
function fakeScene() {
  const scene = Object.create(SlingPuckScene.prototype);
  scene.disposables = [];
  scene.bandCurve = () => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3, 0.22, 3),
    new THREE.Vector3(0, 0.2, 3),
    new THREE.Vector3(3, 0.22, 3),
  ]);
  scene.track = resource => {
    scene.disposables.push(resource);
    return resource;
  };
  scene.bands = {};
  for (const side of ['player', 'opponent']) {
    scene.bands[side] = {
      geometry: new THREE.TubeGeometry(scene.bandCurve(side, null), 8, 0.026, 4, false),
      // buildBands() built these at rest, so they already carry the rest key.
      userData: { bandKey: 'rest' },
    };
  }
  return scene;
}

test('dragging never retains replaced band geometry for the lifetime of the scene', () => {
  const scene = fakeScene();
  const first = scene.bands.player.geometry;
  const disposeSpy = jest.spyOn(first, 'dispose');

  // A second of 120Hz pointer moves is ~120 rebuilds; all but the final one are
  // garbage once replaced.
  for (let i = 0; i < 120; i++) {
    scene.setBand('player', new THREE.Vector3(i * 0.01, 0.22, 2));
  }

  expect(disposeSpy).toHaveBeenCalled();
  expect(scene.disposables).toHaveLength(0);
});

test('a band already at rest is not rebuilt on every pointer move', () => {
  const scene = fakeScene();
  const idle = scene.bands.opponent.geometry;
  const disposeSpy = jest.spyOn(idle, 'dispose');

  scene.setBand('opponent', null);
  scene.setBand('opponent', null);
  scene.setBand('opponent', null);

  expect(disposeSpy).not.toHaveBeenCalled();
  expect(scene.bands.opponent.geometry).toBe(idle);
});

test('the same drag point does not rebuild the band twice', () => {
  const scene = fakeScene();
  const point = new THREE.Vector3(0.5, 0.22, 1);
  scene.setBand('player', point);
  const built = scene.bands.player.geometry;
  const disposeSpy = jest.spyOn(built, 'dispose');

  scene.setBand('player', point.clone());

  expect(disposeSpy).not.toHaveBeenCalled();
  expect(scene.bands.player.geometry).toBe(built);
});
