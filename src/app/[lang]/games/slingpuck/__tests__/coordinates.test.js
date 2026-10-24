import { physicsToScene, sceneToPhysics, SCENE_SCALE } from '../render/coordinates';

test('maps player half to screen-bottom scene z and round-trips', () => {
  expect(physicsToScene(100, -200)).toEqual({ x: 100 * SCENE_SCALE, z: 200 * SCENE_SCALE });
  expect(physicsToScene(0, 300)).toEqual({ x: 0, z: -300 * SCENE_SCALE });
  const back = sceneToPhysics(...Object.values(physicsToScene(-75, 125)));
  expect(back.x).toBeCloseTo(-75);
  expect(back.y).toBeCloseTo(125);
});
