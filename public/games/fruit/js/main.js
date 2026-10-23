var game;

// 只在组件仍挂载时创建游戏；加载脚本本身不启动实例
function createFruitGame(containerId, lang) {
  game = new Phaser.Game(640, 480, Phaser.CANVAS, containerId);
  game.fruitLang = lang;
  game.States = {};
  game.States.boot = function() {
    this.preload = BootScene.preload;
    this.create = BootScene.create;
  };
  game.States.preload = function() {
    this.preload = PreloadScene.preload;
    this.create = PreloadScene.create;
  };
  game.States.main = function() {
    this.create = MainScene.create.bind(MainScene);
    this.update = MainScene.update.bind(MainScene);
    this.shutdown = MainScene.shutdown.bind(MainScene);
  };
  game.States.play = function() {
    this.create = PlayScene.create.bind(PlayScene);
    this.update = PlayScene.update.bind(PlayScene);
    this.shutdown = PlayScene.shutdown.bind(PlayScene);
  };
  game.state.add('boot', game.States.boot);
  game.state.add('preload', game.States.preload);
  game.state.add('main', game.States.main);
  game.state.add('play', game.States.play);
  game.state.start('boot');
  return game;
}
