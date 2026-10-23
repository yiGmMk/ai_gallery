const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadRules() {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'public/games/fruit/js/gameRules.js'), 'utf8'), context);
  return context.FruitGameRules;
}

const sequence = (...values) => {
  let index = 0;
  return () => values[index++] ?? 0.5;
};

let rules;
beforeEach(() => { rules = loadRules(); });

describe('lives and automatic power-ups', () => {
  test('starts with five lives and no effects', () => {
    const state = rules.createState();
    expect(state.lives).toBe(5);
    expect(state.hasShield).toBe(false);
    expect(rules.motionScale(state)).toBe(1);
  });

  test('miss protection expires exactly after 800ms without mutating input', () => {
    const initial = rules.createState();
    const first = rules.resolve(initial, 'miss');
    expect(initial.lives).toBe(5);
    expect(first.damage).toBe(1);
    expect(first.state.lives).toBe(4);
    const before = rules.advance(first.state, 799, true);
    expect(rules.resolve(before, 'miss').state.lives).toBe(4);
    const after = rules.advance(before, 1, true);
    expect(rules.resolve(after, 'miss').state.lives).toBe(3);
  });

  test('bombs cost two lives even during miss protection', () => {
    const missed = rules.resolve(rules.createState(), 'miss').state;
    const result = rules.resolve(missed, 'bomb');
    expect(result.damage).toBe(2);
    expect(result.state.lives).toBe(2);
  });

  test('shield blocks one bomb but never absorbs a miss or stacks', () => {
    let state = rules.resolve(rules.createState(), 'shield').state;
    state = rules.resolve(state, 'shield').state;
    state = rules.resolve(state, 'miss').state;
    expect(state.hasShield).toBe(true);
    const blocked = rules.resolve(state, 'bomb');
    expect(blocked.damage).toBe(0);
    expect(blocked.state.lives).toBe(4);
    expect(blocked.state.hasShield).toBe(false);
    expect(rules.resolve(blocked.state, 'bomb').state.lives).toBe(2);
  });

  test('hearts restore one life without exceeding five', () => {
    let state = rules.resolve(rules.createState(), 'bomb').state;
    state = rules.resolve(state, 'heart').state;
    expect(state.lives).toBe(4);
    state = rules.resolve(state, 'heart').state;
    expect(state.lives).toBe(5);
    expect(rules.resolve(state, 'heart').applied).toBe(false);
  });

  test.each(['heart', 'shield', 'freeze', 'miss', 'bomb'])('death is final for %s', (event) => {
    const dead = { ...rules.createState(), lives: 1 };
    const state = rules.resolve(dead, 'bomb').state;
    expect(state.lives).toBe(0);
    expect(rules.resolve(state, event).applied).toBe(false);
    expect(rules.resolve(state, event).state.lives).toBe(0);
    expect(rules.advance(state, 1000, false).elapsedMs).toBe(0);
    expect(rules.nextWave(state, () => 0).spawns).toHaveLength(0);
  });

  test('freeze refreshes to five seconds without stacking its multiplier', () => {
    let state = rules.resolve(rules.createState(), 'freeze').state;
    expect(rules.motionScale(state)).toBe(0.55);
    state = rules.advance(state, 4000, true);
    state = rules.resolve(state, 'freeze').state;
    expect(state.frozenUntilMs).toBe(9000);
    expect(rules.motionScale(state)).toBe(0.55);
    state = rules.advance(state, 4999, true);
    expect(rules.motionScale(state)).toBe(0.55);
    state = rules.advance(state, 1, true);
    expect(rules.motionScale(state)).toBe(1);
  });
});

describe('waves and item drops', () => {
  test('first wave is immediate; cleared waves wait 700ms without deadline drift', () => {
    const first = rules.nextWave(rules.createState(), () => 0.5);
    expect(first.spawns.filter(s => s.type === 'fruit')).toHaveLength(3);
    expect(first.state.nextWaveAt).toBe(null);
    let state = rules.advance(first.state, 100, false);
    expect(state.nextWaveAt).toBe(800);
    state = rules.advance(state, 699, false);
    expect(state.nextWaveAt).toBe(800);
    expect(rules.nextWave(state, () => 0).spawns).toHaveLength(0);
    state = rules.advance(state, 1, false);
    expect(rules.nextWave(state, () => 0).spawns.length).toBeGreaterThan(0);
  });

  test('before 15 seconds there are neither bombs nor fast fruit', () => {
    const state = { ...rules.createState(), elapsedMs: 14999 };
    const { spawns } = rules.nextWave(state, () => 0.999);
    expect(spawns.filter(s => s.type === 'fruit')).toHaveLength(3);
    expect(spawns.some(s => s.type === 'bomb' || s.speedTier === 'fast')).toBe(false);
  });

  test('at 15 seconds bombs may appear alongside at least two fruits', () => {
    const state = { ...rules.createState(), elapsedMs: 15000 };
    const { spawns } = rules.nextWave(state, () => 0);
    expect(spawns.filter(s => s.type === 'fruit')).toHaveLength(2);
    expect(spawns.filter(s => s.type === 'bomb')).toHaveLength(1);
  });

  test('base speed thresholds are slow below .6, normal below .9, then fast', () => {
    const state = { ...rules.createState(), elapsedMs: 90000 };
    const { spawns } = rules.nextWave(state, sequence(0.5, 0.5999, 0.6, 0.9, 0.99, 0.99, 0.99));
    expect(spawns.filter(s => s.type === 'fruit').map(s => s.speedTier)).toEqual(['slow', 'normal', 'fast']);
  });

  test('fast fruit cannot occur consecutively, including across waves', () => {
    const state = { ...rules.createState(), elapsedMs: 90000, lastSpeedTier: 'fast' };
    const result = rules.nextWave(state, () => 0.999);
    expect(result.spawns.filter(s => s.type === 'fruit').map(s => s.speedTier))
      .toEqual(['normal', 'fast', 'normal', 'fast']);
  });

  test('difficulty and maximum fruit count stop increasing after 90 seconds', () => {
    const atCap = rules.nextWave({ ...rules.createState(), elapsedMs: 90000 }, () => 0.999);
    const late = rules.nextWave({ ...rules.createState(), elapsedMs: 900000 }, () => 0.999);
    expect(atCap.spawns.filter(s => s.type === 'fruit')).toHaveLength(4);
    expect(late.spawns).toEqual(atCap.spawns);
    expect(rules.launch('slow', 900000, { width: 640, height: 480 }, () => 0.5))
      .toEqual(rules.launch('slow', 90000, { width: 640, height: 480 }, () => 0.5));
  });

  test('items wait eight seconds between spawns and are guaranteed at twenty', () => {
    const early = rules.nextWave({ ...rules.createState(), elapsedMs: 7999 }, () => 0);
    expect(early.spawns.some(s => s.type === 'powerUp')).toBe(false);
    const eligible = rules.nextWave({ ...rules.createState(), elapsedMs: 8000 }, () => 0);
    expect(eligible.spawns.filter(s => s.type === 'powerUp')).toHaveLength(1);
    expect(eligible.state.lastPowerUpAt).toBe(8000);
    const cooldown = rules.nextWave({ ...eligible.state, nextWaveAt: 0, elapsedMs: 15999 }, () => 0);
    expect(cooldown.spawns.some(s => s.type === 'powerUp')).toBe(false);
    const guaranteed = rules.nextWave({ ...rules.createState(), elapsedMs: 20000 }, () => 0.999);
    expect(guaranteed.spawns.filter(s => s.type === 'powerUp')).toHaveLength(1);
  });

  test('full health and an existing shield leave only freeze as a useful item', () => {
    const state = { ...rules.createState(), elapsedMs: 20000, hasShield: true };
    const items = rules.nextWave(state, () => 0).spawns.filter(s => s.type === 'powerUp');
    expect(items[0].powerUpKind).toBe('freeze');
  });

  test('low health increases the heart selection weight', () => {
    const state = { ...rules.createState(), elapsedMs: 20000 };
    const draw = (lives) => rules.nextWave({ ...state, lives }, () => 0.55).spawns
      .find(s => s.type === 'powerUp').powerUpKind;
    expect(draw(2)).toBe('heart');
    expect(draw(4)).not.toBe('heart');
  });
});

describe('reachable, mixed-speed trajectories', () => {
  test.each(['slow', 'normal', 'fast'])('%s follows a visible arc with both endpoints inside safe margins', (tier) => {
    for (const value of [0, 0.5, 0.999]) {
      const shot = rules.launch(tier, 90000, { width: 640, height: 480 }, () => value);
      const apexY = shot.y - shot.vy * shot.vy / (2 * shot.gravity);
      const flight = -2 * shot.vy / shot.gravity;
      expect(apexY).toBeGreaterThanOrEqual(119.999);
      expect(apexY).toBeLessThanOrEqual(190);
      expect(shot.x).toBeGreaterThanOrEqual(72);
      expect(shot.x).toBeLessThanOrEqual(568);
      expect(shot.x + shot.vx * flight).toBeGreaterThanOrEqual(71.999);
      expect(shot.x + shot.vx * flight).toBeLessThanOrEqual(568.001);
      if (tier === 'slow') {
        const visible = 2 * Math.sqrt(2 * (480 - apexY) / shot.gravity);
        expect(visible).toBeGreaterThan(2.3);
      }
    }
  });

  test('slower fruit has more visible time without a lower peak', () => {
    const slow = rules.launch('slow', 0, { width: 640, height: 480 }, () => 0.5);
    const fast = rules.launch('fast', 0, { width: 640, height: 480 }, () => 0.5);
    expect(-2 * slow.vy / slow.gravity).toBeGreaterThan(-2 * fast.vy / fast.gravity);
    expect(slow.y - slow.vy ** 2 / (2 * slow.gravity)).toBeCloseTo(155);
    expect(fast.y - fast.vy ** 2 / (2 * fast.gravity)).toBeCloseTo(155);
  });
});
