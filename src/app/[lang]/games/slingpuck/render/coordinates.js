// Physics uses board units with +y pointing away from the player and the
// player's half at y < 0. The scene lays the board on the XZ plane with the
// player's half toward the camera (+z).
import { BOARD } from '../core/constants';

export const SCENE_SCALE = 0.01;

// Multiplying (rather than dividing) by the scale keeps the round trip exact
// for integers such as (100, -200), which is what tests and debug hooks expect.
export function physicsToScene(x, y) {
  return { x: x * SCENE_SCALE, z: -y * SCENE_SCALE };
}

export function sceneToPhysics(x, z) {
  return { x: x * (1 / SCENE_SCALE), y: -z * (1 / SCENE_SCALE) };
}

// Bounds for pointer rays that miss the board; input just outside the frame is
// still valid so a drag can run past the rim.
export function isWithinBoard(x, y, margin = 1.4) {
  return Math.abs(x) <= (BOARD.width / 2) * margin && Math.abs(y) <= (BOARD.height / 2) * margin;
}
