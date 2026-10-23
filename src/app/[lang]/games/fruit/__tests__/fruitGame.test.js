const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptDirectory = path.join(process.cwd(), 'public/games/fruit/js');

function loadScript(context, filename) {
  vm.runInContext(fs.readFileSync(path.join(scriptDirectory, filename), 'utf8'), context, { filename });
}

function createPointer() {
  return {
    isDown: false,
    isUp: true,
    active: false,
    x: 0,
    y: 0,
    timeDown: 0,
    totalTouches: 0,
    positionDown: { x: 0, y: 0 },
  };
}

function createGame() {
  const mousePointer = createPointer();
  const touchPointer = createPointer();
  const polygons = [];
  const graphics = {
    clear() { polygons.length = 0; },
    beginFill() {},
    endFill() {},
    drawPolygon(points) { polygons.push(points.map(({ x, y }) => ({ x, y }))); },
  };
  const game = {
    width: 640,
    height: 480,
    time: { time: 1000, physicsElapsedMS: 16 },
    input: { mousePointer, activePointer: mousePointer, x: 0, y: 0, maxPointers: -1 },
    add: { graphics: () => graphics },
    scale: { scaleMode: 0 },
  };
  const context = vm.createContext({
    game,
    Date: class extends Date {
      constructor() { super(game.time.time); }
    },
    Phaser: {
      Point: function(x, y) { this.x = x; this.y = y; },
      Polygon: function() { this.setTo = (points) => { this.points = points; }; },
      Rectangle: {
        contains: (rect, x, y) => x >= rect.x && x <= rect.x + rect.width &&
          y >= rect.y && y <= rect.y + rect.height,
      },
      ScaleManager: { SHOW_ALL: 2 },
    },
  });
  loadScript(context, 'mathTool.js');
  loadScript(context, 'bladeObj.js');
  const blade = new context.Blade({ game });
  blade.allowBlade();

  function move(pointer, x, y) {
    Object.assign(pointer, { x, y });
    Object.assign(game.input, { activePointer: pointer, x, y });
  }
  function press(pointer, x, y) {
    move(pointer, x, y);
    Object.assign(pointer, {
      isDown: true,
      isUp: false,
      active: true,
      timeDown: game.time.time,
      totalTouches: pointer.totalTouches + 1,
      positionDown: { x, y },
    });
  }
  function release(pointer) {
    Object.assign(pointer, { isDown: false, isUp: true, active: false });
  }
  function update(elapsed = 16) {
    game.time.time += elapsed;
    blade.update();
  }
  function hits(rect = { x: 40, y: 10, width: 20, height: 20 }) {
    let count = 0;
    blade.checkCollide({ body: rect }, () => { count++; });
    return count;
  }
  return { game, context, blade, mousePointer, touchPointer, polygons, press, move, release, update, hits };
}

describe('fruit blade input', () => {
  test.each(['mousePointer', 'touchPointer'])('%s can cut across a fruit with two samples', (pointerName) => {
    const fixture = createGame();
    const pointer = fixture[pointerName];
    fixture.press(pointer, 0, 20);
    fixture.update();
    fixture.move(pointer, 100, 20);
    fixture.update();

    expect(fixture.hits()).toBe(1);
    expect(fixture.polygons.length).toBeGreaterThan(0);
  });

  test('uses touch coordinates rather than shared input or mouse coordinates', () => {
    const fixture = createGame();
    fixture.press(fixture.touchPointer, 0, 20);
    fixture.update();
    fixture.move(fixture.touchPointer, 100, 20);
    fixture.game.input.x = 500;
    fixture.game.input.y = 400;
    fixture.update();

    expect(fixture.mousePointer.isDown).toBe(false);
    expect(fixture.hits()).toBe(1);
  });

  test('includes movement between touch down and the first frame', () => {
    const fixture = createGame();
    fixture.press(fixture.touchPointer, 0, 20);
    fixture.move(fixture.touchPointer, 100, 20);
    fixture.update();

    expect(fixture.hits()).toBe(1);
  });

  test('does not replay a stroke that started before the blade was enabled', () => {
    const fixture = createGame();
    fixture.press(fixture.touchPointer, 0, 20);
    fixture.game.time.time += 100;
    fixture.blade.allowBlade();
    fixture.move(fixture.touchPointer, 100, 20);
    fixture.update();

    expect(fixture.hits()).toBe(0);
  });

  test('a tap or stationary press cannot cut a fruit', () => {
    const fixture = createGame();
    fixture.press(fixture.touchPointer, 50, 20);
    fixture.update();
    expect(fixture.hits()).toBe(0);
    fixture.update();
    expect(fixture.hits()).toBe(0);
  });

  test('short movements below the visual sampling threshold still collide', () => {
    const fixture = createGame();
    fixture.press(fixture.mousePointer, 38, 20);
    fixture.update();
    fixture.move(fixture.mousePointer, 42, 20);
    fixture.update();

    expect(fixture.hits()).toBe(1);
  });

  test('a held pointer cannot slice fruit entering an old trail', () => {
    const fixture = createGame();
    fixture.press(fixture.mousePointer, 0, 20);
    fixture.update();
    fixture.move(fixture.mousePointer, 50, 20);
    fixture.update();
    fixture.move(fixture.mousePointer, 100, 20);
    fixture.update();
    fixture.update();

    expect(fixture.hits()).toBe(0);
  });

  test('release or touch cancellation invalidates the current segment', () => {
    const fixture = createGame();
    fixture.press(fixture.touchPointer, 0, 20);
    fixture.update();
    fixture.move(fixture.touchPointer, 100, 20);
    fixture.update();
    fixture.release(fixture.touchPointer);

    expect(fixture.hits()).toBe(0);
    fixture.update();
    expect(fixture.hits()).toBe(0);
  });

  test('separate strokes do not reuse an old point inside a fruit', () => {
    const fixture = createGame();
    fixture.press(fixture.mousePointer, 0, 20);
    fixture.update();
    fixture.move(fixture.mousePointer, 50, 20);
    fixture.update();
    fixture.move(fixture.mousePointer, 100, 20);
    fixture.update();
    fixture.release(fixture.mousePointer);
    fixture.update();
    fixture.press(fixture.mousePointer, 300, 20);
    fixture.update();

    expect(fixture.hits()).toBe(0);
    expect(fixture.hits({ x: 190, y: 10, width: 20, height: 20 })).toBe(0);
  });

  test('same-frame release and repress cannot connect separate strokes', () => {
    const fixture = createGame();
    fixture.press(fixture.mousePointer, 0, 20);
    fixture.update(0);
    fixture.move(fixture.mousePointer, 50, 20);
    fixture.update(0);
    fixture.release(fixture.mousePointer);
    fixture.press(fixture.mousePointer, 300, 20);
    fixture.move(fixture.mousePointer, 350, 20);
    fixture.update(0);

    expect(fixture.hits()).toBe(0);
    expect(fixture.hits({ x: 190, y: 10, width: 20, height: 20 })).toBe(0);
    expect(fixture.hits({ x: 320, y: 10, width: 10, height: 20 })).toBe(1);
  });

  test('another activePointer cannot hijack a held touch stroke', () => {
    const fixture = createGame();
    fixture.press(fixture.touchPointer, 0, 20);
    fixture.update();
    fixture.move(fixture.touchPointer, 100, 20);
    fixture.move(fixture.mousePointer, 500, 400);
    fixture.update();

    expect(fixture.hits()).toBe(1);
    expect(fixture.hits({ x: 240, y: 190, width: 30, height: 30 })).toBe(0);
  });

  test('does not connect or replay a held second pointer when the first ends', () => {
    const fixture = createGame();
    fixture.press(fixture.touchPointer, 0, 20);
    fixture.update();
    fixture.move(fixture.touchPointer, 100, 20);
    fixture.update();
    const secondPointer = createPointer();
    fixture.press(secondPointer, 0, 20);
    fixture.move(secondPointer, 300, 20);
    fixture.update();
    fixture.release(fixture.touchPointer);
    fixture.update();
    fixture.update();

    expect(fixture.hits()).toBe(0);
    expect(fixture.hits({ x: 190, y: 10, width: 20, height: 20 })).toBe(0);
  });

  test('removes all expired visual points in one update', () => {
    const fixture = createGame();
    fixture.press(fixture.mousePointer, 0, 20);
    fixture.update();
    fixture.move(fixture.mousePointer, 50, 20);
    fixture.update();
    fixture.move(fixture.mousePointer, 100, 20);
    fixture.update();
    fixture.update(201);

    expect(fixture.polygons).toHaveLength(0);
    expect(fixture.hits()).toBe(0);
  });

  test('cut angle follows the intersecting segment rather than the entire trail', () => {
    const fixture = createGame();
    fixture.press(fixture.mousePointer, 0, 0);
    fixture.update();
    fixture.move(fixture.mousePointer, 50, 0);
    fixture.update();
    fixture.move(fixture.mousePointer, 50, 100);
    fixture.update();

    expect(fixture.hits({ x: 40, y: 40, width: 20, height: 20 })).toBe(1);
    expect(fixture.blade.collideDeg()).toBe(90);
  });

  test('cut angle is safe before any collision', () => {
    expect(createGame().blade.collideDeg()).toBe(0);
  });
});

describe('continuous slice geometry', () => {
  const rect = { x: 40, y: 40, width: 20, height: 20 };
  test.each([
    ['horizontal', [0, 50], [100, 50], true],
    ['vertical', [50, 0], [50, 100], true],
    ['diagonal', [0, 0], [100, 100], true],
    ['reversed', [100, 50], [0, 50], true],
    ['edge', [0, 40], [100, 40], true],
    ['corner', [0, 0], [40, 40], true],
    ['inside', [45, 45], [55, 55], true],
    ['ends inside', [0, 50], [50, 50], true],
    ['outside parallel', [0, 30], [100, 30], false],
    ['stops short', [0, 50], [39, 50], false],
    ['extension only', [61, 50], [100, 50], false],
    ['zero movement', [50, 50], [50, 50], false],
  ])('%s segment has the expected intersection', (_name, from, to, expected) => {
    const { context } = createGame();
    expect(typeof context.mathTool.segmentIntersectsRect).toBe('function');
    expect(context.mathTool.segmentIntersectsRect(
      { x: from[0], y: from[1] }, { x: to[0], y: to[1] }, rect
    )).toBe(expected);
  });

  test.each([
    ['horizontal', [0, 50], [100, 50], 0.4],
    ['vertical', [50, 0], [50, 100], 0.4],
    ['diagonal', [0, 0], [100, 100], 0.4],
    ['reversed', [100, 50], [0, 50], 0.4],
    ['starts inside', [50, 50], [100, 50], 0],
    ['touches at end', [0, 50], [40, 50], 1],
  ])('blade reports first entry along the %s segment', (_name, from, to, expected) => {
    const fixture = createGame();
    fixture.press(fixture.touchPointer, ...from);
    fixture.update();
    fixture.move(fixture.touchPointer, ...to);
    fixture.update();
    const hit = jest.fn();
    fixture.blade.checkCollide({ alive: true, body: rect }, hit);
    expect(hit).toHaveBeenCalledWith(expected);
  });

  test('ignores an empty fruit body', () => {
    const { context } = createGame();
    expect(typeof context.mathTool.segmentIntersectsRect).toBe('function');
    expect(context.mathTool.segmentIntersectsRect(
      { x: 0, y: 50 }, { x: 100, y: 50 }, { ...rect, width: 0 }
    )).toBe(false);
  });
});

describe('gameplay slice integration', () => {
  function createScene(fixture, types) {
    loadScript(fixture.context, 'gameRules.js');
    loadScript(fixture.context, 'playScene.js');
    const scene = fixture.context.PlayScene;
    scene.blade = fixture.blade;
    scene.playing = true;
    scene.rules = fixture.context.FruitGameRules.createState();
    scene.rules.nextWaveAt = null;
    scene.healthText = { text: '' };
    scene.effectText = { text: '' };
    scene.hintText = { text: '' };
    scene.noticeText = { text: '' };
    scene.noticeUntilMs = 0;
    scene.remnants = [];
    scene.feedback = [];
    fixture.game.add.bitmapData = () => ({ context: document.createElement('canvas').getContext('2d') });
    fixture.game.add.sprite = (x, y) => ({ x, y, anchor: { setTo() {} }, destroy() {} });
    fixture.game.add.text = fixture.game.add.sprite;
    fixture.game.input.onDown = { add() {}, remove() {} };
    fixture.game.input.onUp = { add() {}, remove() {} };
    scene.score = 0;
    scene.scoreText = { text: '0' };
    scene.fruits = types.map((isFruit, index) => {
      const sprite = {
        alive: true,
        inWorld: true,
        body: { x: 40 + index * 30, y: 10, width: 20, height: 20, velocity: { x: 0, y: -1 }, gravity: { y: 340 } },
        destroy() { this.alive = false; },
      };
      return {
        type: isFruit ? 'fruit' : 'bomb',
        baseGravity: 340,
        motionScale: 1,
        sprite: () => sprite,
        half() { sprite.alive = false; },
      };
    });
    return scene;
  }

  test.each([
    ['rightward', [0, 20], [120, 20], [70, 10], [20, 10]],
    ['leftward', [120, 20], [0, 20], [20, 10], [70, 10]],
    ['downward', [20, 0], [20, 120], [10, 70], [10, 20]],
    ['diagonal', [0, 0], [120, 120], [70, 70], [20, 20]],
  ])('a %s swipe activates a shield before a later bomb regardless of spawn order', (_name, from, to, bombPos, shieldPos) => {
    const fixture = createGame();
    const scene = createScene(fixture, [false, false]);
    const [bomb, shield] = scene.fruits;
    shield.type = 'powerUp';
    shield.powerUpKind = 'shield';
    Object.assign(bomb.sprite().body, { x: bombPos[0], y: bombPos[1] });
    Object.assign(shield.sprite().body, { x: shieldPos[0], y: shieldPos[1] });
    scene.rules.lives = 1;
    fixture.press(fixture.touchPointer, ...from);
    scene.update();
    fixture.move(fixture.touchPointer, ...to);
    scene.update();
    expect(scene.playing).toBe(true);
    expect(scene.rules.lives).toBe(1);
    expect(scene.rules.hasShield).toBe(false);
    expect(scene.fruits).toHaveLength(0);
  });

  test('a heart crossed before a bomb can save the last two lives', () => {
    const fixture = createGame();
    const scene = createScene(fixture, [false, false]);
    const [bomb, heart] = scene.fruits;
    heart.type = 'powerUp';
    heart.powerUpKind = 'heart';
    bomb.sprite().body.x = 70;
    heart.sprite().body.x = 20;
    scene.rules.lives = 2;
    fixture.press(fixture.touchPointer, 0, 20);
    scene.update();
    fixture.move(fixture.touchPointer, 120, 20);
    scene.update();
    expect(scene.rules.lives).toBe(1);
    expect(scene.playing).toBe(true);
  });

  test('a lethal bomb crossed first prevents a later shield and fruit despite reversed array order', () => {
    const fixture = createGame();
    const scene = createScene(fixture, [false, true, false]);
    const [shield, fruit, bomb] = scene.fruits;
    shield.type = 'powerUp';
    shield.powerUpKind = 'shield';
    shield.sprite().body.x = 60;
    fruit.sprite().body.x = 90;
    bomb.sprite().body.x = 20;
    scene.rules.lives = 1;
    fixture.press(fixture.touchPointer, 0, 20);
    scene.update();
    fixture.move(fixture.touchPointer, 120, 20);
    scene.update();
    expect(scene.rules.lives).toBe(0);
    expect(scene.playing).toBe(false);
    expect(scene.rules.hasShield).toBe(false);
    expect(scene.score).toBe(0);
    expect(scene.fruits).toHaveLength(0);
  });

  test('overlapping targets resolve by first boundary contact, not center distance', () => {
    const fixture = createGame();
    const scene = createScene(fixture, [false, false]);
    const [bomb, shield] = scene.fruits;
    shield.type = 'powerUp';
    shield.powerUpKind = 'shield';
    Object.assign(bomb.sprite().body, { x: 40, width: 20 });
    Object.assign(shield.sprite().body, { x: 20, width: 100 });
    fixture.press(fixture.touchPointer, 0, 20);
    scene.update();
    fixture.move(fixture.touchPointer, 120, 20);
    scene.update();
    expect(scene.rules.lives).toBe(5);
    expect(scene.rules.hasShield).toBe(false);
  });

  test('one segment cuts both adjacent fruits without skipping a spliced entry', () => {
    const fixture = createGame();
    const scene = createScene(fixture, [true, true]);
    fixture.press(fixture.touchPointer, 0, 20);
    scene.update();
    fixture.move(fixture.touchPointer, 120, 20);
    scene.update();

    expect(scene.score).toBe(2);
    expect(scene.scoreText.text).toBe('2');
    expect(scene.fruits).toHaveLength(0);
  });

  test('a touch stroke can hit a nonlethal bomb and still slice remaining fruit', () => {
    const fixture = createGame();
    const scene = createScene(fixture, [false, true]);
    fixture.press(fixture.touchPointer, 0, 20);
    scene.update();
    fixture.move(fixture.touchPointer, 120, 20);
    scene.update();

    expect(scene.rules.lives).toBe(3);
    expect(scene.playing).toBe(true);
    expect(scene.score).toBe(1);
    expect(scene.fruits).toHaveLength(0);
  });
});

describe('mobile boot configuration', () => {
  test('enables Phaser scaling and single-touch input before loading the game', () => {
    const { game, context } = createGame();
    let configurationAtStart;
    game.state = {
      start(state) {
        configurationAtStart = {
          state, scaleMode: game.scale.scaleMode, maxPointers: game.input.maxPointers,
          width: game.width, height: game.height,
        };
      },
    };
    loadScript(context, 'bootScene.js');
    context.BootScene.create();

    expect(configurationAtStart).toEqual({
      state: 'preload', scaleMode: 2, maxPointers: 1, width: 640, height: 480,
    });
  });
});
