var FruitGameRules = (function() {
  var config = {
    maxLives: 5,
    bombDamage: 2,
    missProtectionMs: 800,
    warmupMs: 15000,
    difficultyCapMs: 90000,
    waveGapMs: 700,
    freezeMs: 5000,
    freezeScale: 0.55,
    powerUpCooldownMs: 8000,
    powerUpGuaranteeMs: 20000,
    powerUpChance: 0.35,
    gravity: { slow: 340, normal: 500, fast: 720 },
    margin: 72
  };
  function difficulty(elapsedMs) {
    return Math.max(0, Math.min(1, (elapsedMs - config.warmupMs) /
      (config.difficultyCapMs - config.warmupMs)));
  }
  function createState() {
    return {
      lives: config.maxLives,
      hasShield: false,
      elapsedMs: 0,
      frozenUntilMs: 0,
      nextMissDamageAt: 0,
      nextWaveAt: 0,
      lastPowerUpAt: 0,
      lastSpeedTier: null
    };
  }
  function advance(state, dtMs, hasLiveObjects) {
    if(state.lives <= 0) return state;
    var next = Object.assign({}, state);
    next.elapsedMs += Math.max(0, Number.isFinite(dtMs) ? dtMs : 0);
    if(!hasLiveObjects && next.nextWaveAt === null) {
      next.nextWaveAt = next.elapsedMs + config.waveGapMs;
    }
    return next;
  }
  function resolve(state, event) {
    var next = Object.assign({}, state);
    var applied = false;
    var damage = 0;
    if(state.lives <= 0) return { state: next, applied: false, damage: 0 };
    if(event === 'miss' && state.elapsedMs >= state.nextMissDamageAt) {
      damage = 1;
      next.nextMissDamageAt = state.elapsedMs + config.missProtectionMs;
      applied = true;
    } else if(event === 'bomb') {
      if(state.hasShield) next.hasShield = false;
      else damage = config.bombDamage;
      applied = true;
    } else if(event === 'heart' && state.lives < config.maxLives) {
      next.lives++;
      applied = true;
    } else if(event === 'shield' && !state.hasShield) {
      next.hasShield = true;
      applied = true;
    } else if(event === 'freeze') {
      next.frozenUntilMs = state.elapsedMs + config.freezeMs;
      applied = true;
    }
    next.lives = Math.max(0, next.lives - damage);
    return { state: next, applied: applied, damage: damage };
  }
  function choosePowerUp(state, random) {
    var candidates = [{ kind: 'freeze', weight: 1 }];
    if(!state.hasShield) candidates.unshift({ kind: 'shield', weight: 1 });
    if(state.lives < config.maxLives) {
      candidates.unshift({ kind: 'heart', weight: state.lives <= 2 ? 4 : 1 });
    }
    var total = candidates.reduce(function(sum, item) { return sum + item.weight; }, 0);
    var draw = random() * total;
    for(var i=0; i<candidates.length; i++) {
      draw -= candidates[i].weight;
      if(draw < 0) return candidates[i].kind;
    }
    return 'freeze';
  }
  function nextWave(state, random) {
    random = random || Math.random;
    if(state.lives <= 0 || state.nextWaveAt === null || state.elapsedMs < state.nextWaveAt) {
      return { state: state, spawns: [] };
    }
    var next = Object.assign({}, state, { nextWaveAt: null });
    var warmup = state.elapsedMs < config.warmupMs;
    var level = difficulty(state.elapsedMs);
    var count = 2 + Math.floor(random() * (2 + level));
    var spawns = [];
    for(var i=0; i<count; i++) {
      var draw = random();
      var tier = warmup ? (draw < 2 / 3 ? 'slow' : 'normal') :
        (draw < 0.6 ? 'slow' : draw < 0.9 ? 'normal' : 'fast');
      if(tier === 'fast' && next.lastSpeedTier === 'fast') tier = 'normal';
      next.lastSpeedTier = tier;
      spawns.push({ type: 'fruit', speedTier: tier });
    }
    if(!warmup && random() < 0.1 + level * 0.15) {
      spawns.push({ type: 'bomb', speedTier: 'normal' });
    }
    var sinceItem = state.elapsedMs - state.lastPowerUpAt;
    if(sinceItem >= config.powerUpCooldownMs &&
      (sinceItem >= config.powerUpGuaranteeMs || random() < config.powerUpChance)) {
      spawns.push({ type: 'powerUp', speedTier: 'slow', powerUpKind: choosePowerUp(state, random) });
      next.lastPowerUpAt = state.elapsedMs;
    }
    return { state: next, spawns: spawns };
  }
  function launch(tier, elapsedMs, bounds, random) {
    random = random || Math.random;
    var gravity = config.gravity[tier] * (0.92 + random() * 0.16) * (1 + difficulty(elapsedMs) * 0.15);
    var y = bounds.height + 40;
    var apex = 120 + random() * 70;
    var vy = -Math.sqrt(2 * gravity * (y - apex));
    var flight = -2 * vy / gravity;
    var x = config.margin + random() * (bounds.width - config.margin * 2);
    var targetX = config.margin + random() * (bounds.width - config.margin * 2);
    return { x: x, y: y, vx: (targetX - x) / flight, vy: vy, gravity: gravity };
  }
  function motionScale(state) {
    return state.lives > 0 && state.elapsedMs < state.frozenUntilMs ? config.freezeScale : 1;
  }
  return {
    config: config,
    createState: createState,
    advance: advance,
    resolve: resolve,
    nextWave: nextWave,
    launch: launch,
    motionScale: motionScale
  };
})();
