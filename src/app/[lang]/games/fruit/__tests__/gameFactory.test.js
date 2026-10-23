const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('script loading does not auto-start; explicit creation binds shutdown and language', () => {
  const created = [];
  const PlayScene = { create() {}, update() {}, shutdown: jest.fn() };
  function Game(width, height, renderer, parent) {
    Object.assign(this, { width, height, parent });
    this.state = { add: jest.fn(), start: jest.fn() };
    created.push(this);
  }
  const context = vm.createContext({
    Phaser: { Game, CANVAS: 1 },
    BootScene: {}, PreloadScene: {}, MainScene: { create() {}, update() {}, shutdown: jest.fn() }, PlayScene,
  });
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'public/games/fruit/js/main.js'), 'utf8'), context);
  expect(created).toHaveLength(0);
  expect(typeof context.createFruitGame).toBe('function');
  const game = context.createFruitGame('game', 'zh');
  expect(game.fruitLang).toBe('zh');
  expect(game.width).toBe(640);
  expect(game.height).toBe(480);
  expect(game.state.start).toHaveBeenCalledWith('boot');
  const play = new game.States.play();
  play.shutdown();
  expect(PlayScene.shutdown).toHaveBeenCalledTimes(1);
  const menu = new game.States.main();
  menu.shutdown();
  expect(context.MainScene.shutdown).toHaveBeenCalledTimes(1);
});
