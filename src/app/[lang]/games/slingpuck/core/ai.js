import { AI_SEARCH, BOARD, DIFFICULTIES, PHYSICS, SCORE } from './constants';
import { simulateShot } from './physics';
import {
  backwardOf,
  clampDragPoint,
  countPucks,
  forwardOf,
  nextSide,
  sideOfPuck,
} from './rules';

const TARGET_X = [-240, 0, 240];
const TARGET_FORWARD = [240, 380, 520, 620];
const POWERS = [0.55, 0.72, 0.88, 1];

/** Mulberry32: small, fast, and deterministic across runs. */
export function seededRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller gaussian using two uniform draws from the seeded rng. */
function gaussian(rng) {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function normalize(dx, dy) {
  const len = Math.hypot(dx, dy);
  return len < 1e-9 ? { x: 0, y: 1 } : { x: dx / len, y: dy / len };
}

function targetPoints(side) {
  const forward = forwardOf(side);
  const points = [];
  for (const x of TARGET_X) {
    for (const distance of TARGET_FORWARD) {
      points.push({ x, y: forward.y * distance });
    }
  }
  // Straight through the divider hole, so the opening gets used too.
  points.push({ x: 0, y: forward.y * (BOARD.height / 2 - BOARD.frame * 1.5) });
  return points;
}

/** Distance from the divider gap centre where this aim line crosses y = 0. */
function gapCrossingDistance(puck, target) {
  const dy = target.y - puck.y;
  if (Math.abs(dy) < 1e-6) return Infinity;
  const t = -puck.y / dy;
  if (t <= 0 || t >= 1) return Infinity;
  return Math.abs(puck.x + (target.x - puck.x) * t);
}

export function scoreResult(before, after, side, simulated) {
  const opponent = nextSide(side);
  const ownAfter = countPucks(after, side);
  const oppAfter = countPucks(after, opponent);
  const ownDelta = countPucks(before, side) - ownAfter;
  // More pucks on the opponent's half is progress for the shooter, even when
  // they are the opponent's own pucks that got pushed there.
  const oppGain = oppAfter - countPucks(before, opponent);
  let score = ownDelta * SCORE.ownDelta + oppGain * SCORE.oppGain - simulated.duration * SCORE.duration;
  if (ownAfter === 0) score += SCORE.win + SCORE.clearOwn;
  if (oppAfter === 0) score -= SCORE.win + SCORE.clearOpp;
  return score;
}

function candidateShot(puck, target, power, side) {
  const direction = normalize(target.x - puck.x, target.y - puck.y);
  // The drag point must pull against the aim vector, otherwise every candidate
  // simulates a straight-ahead shot that the AI never actually takes.
  const length = power * PHYSICS.maxPull;
  const raw = { x: puck.x - direction.x * length, y: puck.y - direction.y * length };
  const clamped = clampDragPoint(puck, raw, side);
  if (clamped.pull < PHYSICS.minPull) return null;
  return {
    puckId: puck.id,
    dragPoint: { x: clamped.x, y: clamped.y },
    pull: clamped.pull,
    power: clamped.power,
    direction,
  };
}

export function chooseShot({
  rapier,
  pucks,
  side,
  difficulty = 'normal',
  rng = seededRng(1),
  simulate = simulateShot,
  now = () => Date.now(),
  budgetMs = AI_SEARCH.budgetMs,
}) {
  const own = pucks.filter(puck => sideOfPuck(puck) === side);
  if (own.length === 0) {
    return { skip: true, reason: 'empty-half', candidatesChecked: 0 };
  }

  const config = DIFFICULTIES[difficulty] ?? DIFFICULTIES.normal;
  const targets = targetPoints(side);
  const started = now();
  const checked = [];
  let candidatesChecked = 0;

  outer:
  for (const puck of own) {
    // Evaluate the lines that actually run through the opening first, so a
    // tight candidate budget does not spend itself on blocked angles.
    const orderedTargets = [...targets].sort(
      (a, b) => gapCrossingDistance(puck, a) - gapCrossingDistance(puck, b)
    );
    for (const target of orderedTargets) {
      for (const power of POWERS) {
        const candidate = candidateShot(puck, target, power, side);
        if (!candidate) continue;
        const simulated = simulate(
          rapier,
          pucks,
          { puckId: puck.id, side, dragPoint: candidate.dragPoint },
          { recordFrames: false, maxTime: AI_SEARCH.simTime }
        );
        candidatesChecked += 1;
        const score = scoreResult(pucks, simulated.pucks, side, simulated);
        checked.push({ ...candidate, score, simulated: { duration: simulated.duration, settled: simulated.settled } });
        if (candidatesChecked >= config.candidates || now() - started >= budgetMs) {
          break outer;
        }
      }
    }
  }

  if (checked.length === 0) {
    return { skip: true, reason: 'no-legal-shot', candidatesChecked };
  }

  checked.sort((a, b) => b.score - a.score || a.puckId - b.puckId);
  const best = checked[0];

  // Easy picks randomly among near-best shots; normal and hard prefer the top few.
  const poolSize = config.pickCount === 0
    ? checked.filter(item => item.score >= best.score - 120 * config.topPool).length
    : Math.min(config.pickCount, checked.length);
  const choice = checked[Math.floor(rng() * poolSize)];

  // Human-like aim error: rotate the shot direction and scale its power.
  const angleError = gaussian(rng) * config.angleSigma;
  const powerError = Math.exp(gaussian(rng) * config.powerSigma);
  const cos = Math.cos(angleError);
  const sin = Math.sin(angleError);
  const rotated = {
    x: choice.direction.x * cos - choice.direction.y * sin,
    y: choice.direction.x * sin + choice.direction.y * cos,
  };
  const start = pucks.find(puck => puck.id === choice.puckId);
  const pullLength = Math.min(PHYSICS.maxPull, choice.pull * powerError);
  const finalDrag = clampDragPoint(start, {
    x: start.x - rotated.x * pullLength,
    y: start.y - rotated.y * pullLength,
  }, side);
  if (finalDrag.pull < PHYSICS.minPull) {
    return { skip: true, reason: 'no-legal-shot', candidatesChecked };
  }

  return {
    puckId: choice.puckId,
    dragPoint: { x: finalDrag.x, y: finalDrag.y },
    pull: finalDrag.pull,
    power: finalDrag.power,
    direction: finalDrag.direction,
    score: best.score,
    simulated: best.simulated,
    candidatesChecked,
  };
}
