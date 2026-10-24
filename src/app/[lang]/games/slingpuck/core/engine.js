import { PHYSICS } from './constants';
import { simulateShot } from './physics';
import {
  clampDragPoint,
  computeShot,
  initialPucks,
  nextSide,
  sideOfPuck,
  winnerAfterShot,
} from './rules';

const clonePucks = pucks => pucks.map(puck => ({ ...puck }));

/**
 * Headless match state: turn ownership, shot validation, simulation result,
 * winner detection and timeout skipping. The React UI and the AI both drive
 * this class, and a future authoritative server can reuse it unchanged.
 */
export class MatchEngine {
  constructor(rapier, { side = 'player', pucks = initialPucks(), simulate = simulateShot } = {}) {
    this.rapier = rapier;
    this.simulate = simulate;
    this.reset({ side, pucks });
  }

  get currentSide() {
    return this.side;
  }

  get winner() {
    return this.winningSide;
  }

  get pucks() {
    return clonePucks(this.state);
  }

  get turn() {
    return this.turnNumber;
  }

  reset({ side = 'player', pucks = initialPucks() } = {}) {
    this.side = side;
    this.state = clonePucks(pucks);
    this.winningSide = null;
    this.turnNumber = 1;
  }

  canShoot(side, puckId) {
    if (this.winningSide) return false;
    if (side !== this.side) return false;
    const puck = this.state.find(item => item.id === puckId);
    return Boolean(puck) && sideOfPuck(puck) === side;
  }

  shoot({ side, puckId, dragPoint }) {
    if (this.winningSide) {
      throw new Error(`Game is over: ${this.winningSide} won`);
    }
    if (side !== this.side) {
      throw new Error(`Not ${side}'s turn`);
    }
    const puck = this.state.find(item => item.id === puckId);
    if (!puck) {
      throw new Error(`Unknown puck ${puckId}`);
    }
    if (sideOfPuck(puck) !== side) {
      throw new Error(`Puck ${puckId} is not in ${side}'s half`);
    }

    const start = { x: puck.x, y: puck.y };
    const clamped = clampDragPoint(start, dragPoint, side);
    if (clamped.pull < PHYSICS.minPull) {
      throw new Error('Pull is too short');
    }
    const shot = computeShot(start, clamped, side);
    const simulated = this.simulate(
      this.rapier,
      this.pucks,
      { puckId, side, dragPoint: clamped },
      { recordFrames: true }
    );

    this.state = clonePucks(simulated.pucks);
    const winner = winnerAfterShot(this.state, side);
    if (winner) {
      this.winningSide = winner;
    }
    const following = nextSide(side);
    if (!winner) {
      this.side = following;
    }
    this.turnNumber += 1;

    return {
      shot: {
        puckId,
        side,
        dragPoint: { x: clamped.x, y: clamped.y },
        pull: clamped.pull,
        power: shot.power,
        direction: shot.direction,
        speed: shot.speed,
      },
      frames: simulated.frames,
      events: simulated.events,
      pucks: this.pucks,
      settled: simulated.settled,
      duration: simulated.duration,
      winner,
      nextSide: winner ? side : following,
      turn: this.turnNumber,
    };
  }

  passTurn() {
    if (!this.winningSide) {
      this.side = nextSide(this.side);
      this.turnNumber += 1;
    }
    return { side: this.side, turn: this.turnNumber };
  }
}
