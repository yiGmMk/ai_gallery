const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function signal() {
  const bindings = [];
  return {
    add(fn, context) { bindings.push({ fn, context }); },
    remove(fn, context) {
      for (let i = bindings.length - 1; i >= 0; i--) {
        if (bindings[i].fn === fn && bindings[i].context === context) bindings.splice(i, 1);
      }
    },
    dispatch(pointer) { bindings.slice().forEach(b => b.fn.call(b.context, pointer)); },
    get count() { return bindings.length; },
  };
}

function fixture(lang = 'en') {
  const textures = {};
  const objects = [];
  function sprite(x = 0, y = 0, key) {
    const object = {
      x, y, key, width: key?.width || 64, height: key?.height || 64,
      alive: true, exists: true, inWorld: true, alpha: 1,
      anchor: { setTo() {} }, scale: { setTo() {} },
      kill() { this.alive = false; this.exists = false; },
      destroy() { this.kill(); this.destroyed = true; },
      reset(x, y) { this.x = x; this.y = y; },
    };
    objects.push(object);
    return object;
  }
  const game = {
    width: 640, height: 480, fruitLang: lang,
    time: { time: 1000, physicsElapsedMS: 16 },
    paused: false,
    input: { onDown: signal(), onUp: signal() },
    state: { start: jest.fn() },
    cache: {
      checkBitmapDataKey: key => !!textures[key],
      getBitmapData: key => textures[key],
      addBitmapData(key, value) { textures[key] = value; },
    },
    physics: {
      startSystem() {},
      enable(object) {
        object.body = {
          x: object.x, y: object.y, width: object.width, height: object.height,
          velocity: { x: 0, y: 0 }, gravity: { x: 0, y: 0 }, enable: true,
          setSize(width, height) { this.width = width; this.height = height; },
        };
      },
    },
    add: {
      sprite, image: sprite,
      text(x, y, text) { return Object.assign(sprite(x, y), { text }); },
      bitmapText(x, y, font, text) { return Object.assign(sprite(x, y), { text }); },
      bitmapData(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return { width, height, ctx: canvas.getContext('2d'), context: canvas.getContext('2d') };
      },
      tween(target) {
        return { to(values) { Object.assign(target, values); return this; }, onComplete: signal() };
      },
    },
  };
  function Fruit(options) {
    const object = sprite(options.x, options.y, options.key);
    game.physics.enable(object);
    this.sprite = () => object;
    this.half = () => object.kill();
  }
  function Bomb(options) {
    Fruit.call(this, options);
    this.explode = () => { throw new Error('Old global explosion must not be used'); };
  }
  const context = vm.createContext({
    game, Fruit, Bomb,
    Phaser: { Physics: { ARCADE: 1 }, Easing: { Sinusoidal: { InOut: 0 } } },
    Blade: function() {
      this.allowBlade = () => {};
      this.update = () => {};
      this.collideDeg = () => 0;
      this.checkCollide = (object, hit) => { if (object.hit && object.alive) hit(0); };
    },
  });
  const load = name => vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'public/games/fruit/js', name), 'utf8'), context);
  load('gameRules.js');
  load('powerUpObj.js');
  load('playScene.js');
  const scene = context.PlayScene;
  scene.create();
  function add(type, options = {}) {
    const entity = scene.createObject({ type, speedTier: 'slow', powerUpKind: options.kind || 'heart' });
    entity.sprite().hit = options.hit || false;
    if (options.out) {
      entity.sprite().inWorld = false;
      entity.sprite().body.velocity.y = 100;
    }
    scene.fruits.push(entity);
    scene.rules.nextWaveAt = null;
    return entity;
  }
  function tick(ms = 16) {
    game.time.physicsElapsedMS = ms;
    game.time.time += ms;
    scene.update();
  }
  return { game, scene, context, textures, objects, add, tick };
}

describe('power-up sprites', () => {
  test.each(['heart', 'shield', 'freeze'])('%s has a visible texture, sized collision body and cached artwork', kind => {
    const { game, context } = fixture();
    const first = new context.PowerUp({ game, kind, x: 100, y: 200 }).sprite();
    const second = new context.PowerUp({ game, kind, x: 0, y: 0 }).sprite();
    expect(first.width).toBe(64);
    expect(first.height).toBe(64);
    expect(first.body.width).toBeGreaterThan(0);
    expect(first.body.width).toBeLessThanOrEqual(64);
    expect(first.key).toBe(second.key);
    expect(first.key.context.__getEvents().length).toBeGreaterThan(5);
  });
});

describe('power-ups in a running round', () => {
  test('a nonlethal bomb costs two lives and the remaining fruit can still score', () => {
    const f = fixture();
    f.add('bomb', { hit: true });
    f.add('fruit', { hit: true });
    f.tick();
    expect(f.scene.rules.lives).toBe(3);
    expect(f.scene.playing).toBe(true);
    expect(f.scene.score).toBe(1);
    expect(f.scene.fruits).toHaveLength(0);
  });

  test('bomb impact shows a local burst and releases it after a short effect', () => {
    const f = fixture();
    const bomb = f.add('bomb', { hit: true });
    const x = bomb.sprite().x;
    f.tick();
    expect(f.scene.feedback).toHaveLength(1);
    const flash = f.scene.feedback[0].sprite;
    expect(flash.x).toBe(x);
    expect(flash.alive).toBe(true);
    f.tick(501);
    expect(flash.destroyed).toBe(true);
    expect(f.scene.feedback).toHaveLength(0);
  });

  test('sliced fruit resources are released after their visual effects', () => {
    const f = fixture();
    const fruit = f.add('fruit', { hit: true });
    f.tick();
    f.tick(4100);
    expect(fruit.sprite().destroyed).toBe(true);
  });

  test.each(['gameOver', 'shutdown'])('%s releases sliced fruit and temporary feedback', action => {
    const f = fixture();
    const fruit = f.add('fruit', { hit: true });
    f.add('bomb', { hit: true });
    f.tick();
    const flash = f.scene.feedback[0].sprite;
    f.scene[action]();
    expect(fruit.sprite().destroyed).toBe(true);
    expect(flash.destroyed).toBe(true);
    expect(f.scene.remnants).toHaveLength(0);
    expect(f.scene.feedback).toHaveLength(0);
  });

  test('a shield absorbs a bomb once', () => {
    const f = fixture();
    f.scene.rules.hasShield = true;
    f.add('bomb', { hit: true });
    f.tick();
    expect(f.scene.rules.lives).toBe(5);
    expect(f.scene.rules.hasShield).toBe(false);
    f.add('bomb', { hit: true });
    f.tick();
    expect(f.scene.rules.lives).toBe(3);
  });

  test('simultaneous misses are all removed but cost only one life', () => {
    const f = fixture();
    for (let i = 0; i < 4; i++) f.add('fruit', { out: true });
    f.tick();
    expect(f.scene.fruits).toHaveLength(0);
    expect(f.scene.rules.lives).toBe(4);
    f.add('fruit', { out: true });
    f.tick(799);
    expect(f.scene.rules.lives).toBe(4);
    f.add('fruit', { out: true });
    f.tick(1);
    expect(f.scene.rules.lives).toBe(3);
  });

  test('missed bombs and items do not damage the player', () => {
    const f = fixture();
    f.add('bomb', { out: true });
    f.add('powerUp', { out: true });
    f.tick();
    expect(f.scene.rules.lives).toBe(5);
    expect(f.scene.fruits).toHaveLength(0);
  });

  test('hearts heal once and are removed immediately', () => {
    const f = fixture();
    f.scene.rules.lives = 3;
    const heart = f.add('powerUp', { kind: 'heart', hit: true });
    f.tick();
    f.tick();
    expect(f.scene.rules.lives).toBe(4);
    expect(heart.sprite().alive).toBe(false);
    expect(f.scene.score).toBe(0);
  });

  test('a lethal bomb stops all later scoring and healing in the same frame', () => {
    const f = fixture();
    f.scene.rules.lives = 1;
    f.add('bomb', { hit: true });
    f.add('powerUp', { hit: true });
    f.add('fruit', { hit: true });
    f.tick();
    expect(f.scene.rules.lives).toBe(0);
    expect(f.scene.playing).toBe(false);
    expect(f.scene.score).toBe(0);
    const elapsed = f.scene.rules.elapsedMs;
    f.tick(1000);
    expect(f.scene.rules.elapsedMs).toBe(elapsed);
  });

  test('freeze scales current motion, refreshes without stacking, and restores new and old objects', () => {
    const f = fixture();
    const fruit = f.add('fruit');
    const body = fruit.sprite().body;
    body.velocity.x = 100;
    body.velocity.y = 200;
    const gravity = fruit.baseGravity;
    f.add('powerUp', { kind: 'freeze', hit: true });
    f.tick();
    expect(body.velocity.x).toBeCloseTo(55);
    expect(body.velocity.y).toBeCloseTo(110);
    expect(body.gravity.y).toBeCloseTo(gravity * 0.55 ** 2);
    const fresh = f.add('fruit');
    expect(fresh.motionScale).toBe(0.55);
    expect(fresh.sprite().body.gravity.y).toBeCloseTo(fresh.baseGravity * 0.55 ** 2);
    f.tick(4000);
    f.add('powerUp', { kind: 'freeze', hit: true });
    f.tick(0);
    expect(body.velocity.x).toBeCloseTo(55);
    f.tick(4999);
    expect(fruit.motionScale).toBe(0.55);
    f.tick(1);
    expect(fruit.motionScale).toBe(1);
    expect(fresh.motionScale).toBe(1);
    expect(body.velocity.x).toBeCloseTo(100);
    expect(body.velocity.y).toBeCloseTo(200);
    expect(body.gravity.y).toBeCloseTo(gravity);
  });

  test('wall-clock gaps do not expire effects or advance warmup', () => {
    const f = fixture();
    f.add('powerUp', { kind: 'freeze', hit: true });
    f.tick();
    f.game.time.time += 60000;
    f.tick(16);
    expect(f.scene.rules.elapsedMs).toBe(32);
    expect(f.context.FruitGameRules.motionScale(f.scene.rules)).toBe(0.55);
  });

  test('game over requires a new press/release and shutdown removes restart listeners', () => {
    const f = fixture();
    const pointer = { isDown: true, totalTouches: 1 };
    f.scene.rules.lives = 0;
    f.scene.gameOver();
    f.scene.gameOver();
    f.game.input.onUp.dispatch(pointer);
    expect(f.game.state.start).not.toHaveBeenCalled();
    pointer.totalTouches++;
    f.game.input.onDown.dispatch(pointer);
    f.game.input.onUp.dispatch(pointer);
    expect(f.game.state.start).toHaveBeenCalledTimes(1);
    f.scene.shutdown();
    expect(f.game.input.onDown.count).toBe(0);
    expect(f.game.input.onUp.count).toBe(0);
    f.scene.create();
    expect(f.scene.rules.lives).toBe(5);
    expect(f.scene.rules.hasShield).toBe(false);
    expect(f.context.FruitGameRules.motionScale(f.scene.rules)).toBe(1);
    f.game.input.onUp.dispatch(pointer);
    expect(f.game.state.start).toHaveBeenCalledTimes(1);
  });

  test.each(['en', 'zh'])('HUD exposes five lives, shield and freeze status in %s', lang => {
    const f = fixture(lang);
    expect(f.scene.healthText.text).toContain('5/5');
    expect(f.scene.healthIcon.width).toBe(24);
    expect(f.scene.healthIcon.body).toBeUndefined();
    f.add('powerUp', { kind: 'shield', hit: true });
    f.add('powerUp', { kind: 'freeze', hit: true });
    f.tick();
    expect(f.scene.effectText.text).toContain(lang === 'zh' ? '护盾' : 'Shield');
    expect(f.scene.effectText.text).toContain(lang === 'zh' ? '冰冻' : 'Freeze');
    expect(f.scene.effectText.text).toContain('5');
  });
});
