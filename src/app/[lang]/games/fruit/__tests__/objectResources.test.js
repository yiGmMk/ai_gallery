const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture() {
  const resources = [];
  const textures = {};
  function resource(properties = {}) {
    const value = { destroyed: false, destroy() { this.destroyed = true; }, ...properties };
    resources.push(value);
    return value;
  }
  const game = {
    cache: {
      addBitmapData(key, value) { textures[key] = value; },
      getBitmapData: key => textures[key],
      removeBitmapData(key) { delete textures[key]; },
    },
    add: {
      sprite(x, y, key) {
        return resource({
          x, y, key, width: 64, height: 64, children: [],
          anchor: { setTo() {} }, kill() { this.alive = false; },
          addChild(child) { this.children.push(child); },
          destroy() { this.destroyed = true; this.children.forEach(child => child.destroy()); },
        });
      },
      bitmapData() {
        const ctx = document.createElement('canvas').getContext('2d');
        return resource({ context: ctx, ctx });
      },
      emitter() {
        return resource({
          makeParticles() {}, setScale() {}, setAlpha() {}, start() {},
          minParticleSpeed: { setTo() {} }, maxParticleSpeed: { setTo() {} },
        });
      },
    },
    physics: {
      enable(object) {
        object.body = { x: object.x, y: object.y, velocity: { x: 0, y: 0 }, gravity: { y: 0 } };
      },
    },
  };
  const context = vm.createContext({
    game, FlameParticle: function() {},
    Phaser: { Physics: { ARCADE: 1 }, Color: { getRGB: () => ({}), getWebRGB: () => '#ffffff' } },
  });
  for (const name of ['fruitObj.js', 'bombObj.js']) {
    vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'public/games/fruit/js', name), 'utf8'), context);
  }
  return { game, context, resources };
}

test.each([false, true])('fruit cleanup releases its bitmap, emitter and all sprites (sliced=%s)', sliced => {
  const { game, context, resources } = fixture();
  const fruit = new context.Fruit({ game, key: 'apple', x: 100, y: 100 });
  if (sliced) fruit.half(30, true);
  expect(resources.every(item => item.destroyed)).toBe(false);
  fruit.destroy();
  expect(resources.every(item => item.destroyed)).toBe(true);
  expect(game.cache.getBitmapData('flameParticle')).toBeUndefined();
  expect(() => fruit.destroy()).not.toThrow();
});

test('bomb cleanup releases its bitmap and child emitter', () => {
  const { game, context, resources } = fixture();
  const bomb = new context.Bomb({ game, x: 100, y: 100 });
  bomb.destroy();
  expect(resources.every(item => item.destroyed)).toBe(true);
  expect(game.cache.getBitmapData('flameParticle')).toBeUndefined();
});

test.each(['Fruit', 'Bomb'])('%s cleanup cannot remove another object\'s particle texture', kind => {
  const { game, context } = fixture();
  const older = new context[kind]({ game, key: 'apple' });
  const newer = new context.Fruit({ game, key: 'peach' });
  const bitmap = game.cache.getBitmapData('flameParticle');
  older.destroy();
  expect(game.cache.getBitmapData('flameParticle')).toBe(bitmap);
  expect(bitmap.destroyed).toBe(false);
  newer.half(0, true);
  newer.destroy();
  expect(bitmap.destroyed).toBe(true);
});
