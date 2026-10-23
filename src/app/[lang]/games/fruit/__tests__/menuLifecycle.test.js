const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture() {
  const context = vm.createContext({
    game: { physics: { startSystem() {} }, add: { image() { return {}; } } },
    Phaser: { Physics: { ARCADE: 1 } },
    Blade: function() {},
  });
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'public/games/fruit/js/mainScene.js'), 'utf8'), context);
  const scene = context.MainScene;
  scene.homeGroupAnim = () => {};
  return scene;
}

test('entering the menu clears a previous interrupted start and stale objects', () => {
  const scene = fixture();
  scene.start = true;
  for (const name of ['peach', 'sandia', 'bomb', 'dojo', 'new_game', 'quit']) scene[name] = {};
  scene.create();
  expect(scene.start).toBe(false);
  for (const name of ['peach', 'sandia', 'bomb', 'dojo', 'new_game', 'quit']) expect(scene[name]).toBeNull();
});

test('leaving the menu releases fruit and bomb owned resources, even during the start animation', () => {
  const scene = fixture();
  const resources = ['peach', 'sandia', 'bomb'].map(name => {
    const value = { released: false, destroy() { this.released = true; } };
    scene[name] = value;
    return value;
  });
  scene.start = true;
  scene.shutdown();
  expect(resources.every(value => value.released)).toBe(true);
  expect(scene.start).toBe(false);
  expect(scene.peach).toBeNull();
});
