import { physicsToScene, sceneToPhysics, isWithinBoard, SCENE_SCALE } from '../render/coordinates';

test('maps player half to screen-bottom scene z and round-trips', () => {
  expect(physicsToScene(100, -200)).toEqual({ x: 100 * SCENE_SCALE, z: 200 * SCENE_SCALE });
  expect(physicsToScene(0, 300)).toEqual({ x: 0, z: -300 * SCENE_SCALE });
  const back = sceneToPhysics(...Object.values(physicsToScene(-75, 125)));
  expect(back.x).toBeCloseTo(-75);
  expect(back.y).toBeCloseTo(125);
});

test('accepts physics coordinates across the whole board and rejects far-off points', () => {
  // A drag starting on the player's front row (see INITIAL_PUCKS) must be usable.
  expect(isWithinBoard(-175, -245)).toBe(true);
  expect(isWithinBoard(300, 520)).toBe(true);
  expect(isWithinBoard(0, 0)).toBe(true);
  expect(isWithinBoard(700, 0)).toBe(false);
  expect(isWithinBoard(0, 1200)).toBe(false);
});
