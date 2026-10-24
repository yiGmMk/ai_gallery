export const BOARD = Object.freeze({
  width: 720,
  height: 1200,
  wall: 34,
  frame: 54,
  dividerThickness: 24,
  // The specs ask for a 76-unit opening, but a 34-radius puck then has only
  // ±4 units of clearance: no legal shot from the initial rows can cross it,
  // and matches never score. 180 leaves a 156-unit opening (±44 clearance).
  gapWidth: 180,
  dividerCapRadius: 12,
  puckRadius: 34,
  puckHeight: 30,
  bandInset: 200,
  surfaceY: 31,
});

export const PHYSICS = Object.freeze({
  fixedDt: 1 / 60,
  maxSpeed: 2350,
  minSpeed: 520,
  maxPull: 170,
  minPull: 16,
  linearDamping: 1.35,
  angularDamping: 2.6,
  friction: 0.22,
  restitution: 0.58,
  settleSpeed: 16,
  settleAngular: 0.8,
  settleTime: 0.45,
  maxShotTime: 8,
  // Rapier 0.21 clamps world-space linear velocity at ~400 u/s. The board is
  // simulated in a 1/50 scale world so full-power shots stay well below it.
  worldScale: 0.02,
});

export const TURN_SECONDS = 30;

export const MAX_DRAG_LATERAL = 1.6;

// Player faces the opponent across the divider: player pucks sit at y < 0.
export const INITIAL_PUCKS = Object.freeze(
  [
    [-175, -245],
    [175, -245],
    [0, -350],
    [-95, -405],
    [95, -405],
    [-175, 245],
    [175, 245],
    [0, 350],
    [-95, 405],
    [95, 405],
  ].map(([x, y], id) => Object.freeze({ id, x, y, angle: id * 0.7, color: id % 2 === 0 ? 'black' : 'ivory' }))
);

export const DIFFICULTIES = Object.freeze({
  easy: Object.freeze({
    candidates: 6,
    angleSigma: 0.2,
    powerSigma: 0.16,
    topPool: 0.4,
    pickCount: 0,
  }),
  normal: Object.freeze({
    candidates: 16,
    angleSigma: 0.075,
    powerSigma: 0.07,
    topPool: 0,
    pickCount: 3,
  }),
  hard: Object.freeze({
    candidates: 30,
    angleSigma: 0.022,
    powerSigma: 0.025,
    topPool: 0,
    pickCount: 1,
  }),
});

export const AI_SEARCH = Object.freeze({
  simTime: 3,
  budgetMs: 250,
});

// Free mode: both sides shoot continuously, so the AI fires on a fixed cadence
// and searches fewer candidates to keep its pause inside one short frame.
export const FREE_AI = Object.freeze({
  cadenceMs: Object.freeze({ easy: 1800, normal: 1200, hard: 700 }),
  search: Object.freeze({
    candidates: Object.freeze({ easy: 4, normal: 8, hard: 14 }),
    budgetMs: 80,
  }),
});

export const SCORE = Object.freeze({
  ownDelta: 120,
  oppGain: 25,
  clearOwn: 800,
  clearOpp: 800,
  win: 2000,
  duration: 0.5,
});
