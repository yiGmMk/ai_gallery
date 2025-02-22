// 加载其他资源的场景
var PreloadScene = {
  // 加载其他所有资源
  preload: function () {
    var preloadSprite = game.add.sprite(10, game.height / 2, 'preloader');
    game.load.setPreloadSprite(preloadSprite);
    game.load.image('preloader', '/games/fruit/assets/preloader.gif');
    game.load.image('apple', '/games/fruit/assets/apple.png');
    game.load.image('apple-1', '/games/fruit/assets/apple-1.png');
    game.load.image('apple-2', '/games/fruit/assets/apple-2.png');
    game.load.image('background', '/games/fruit/assets/background.jpg');
    game.load.image('banana', '/games/fruit/assets/banana.png');
    game.load.image('banana-1', '/games/fruit/assets/banana-1.png');
    game.load.image('banana-2', '/games/fruit/assets/banana-2.png');
    game.load.image('basaha', '/games/fruit/assets/basaha.png');
    game.load.image('basaha-1', '/games/fruit/assets/basaha-1.png');
    game.load.image('basaha-2', '/games/fruit/assets/basaha-2.png');
    game.load.image('best', '/games/fruit/assets/best.png');
    game.load.image('bomb', '/games/fruit/assets/bomb.png');
    game.load.image('dojo', '/games/fruit/assets/dojo.png');
    game.load.image('game-over', '/games/fruit/assets/game-over.png');
    game.load.image('home-desc', '/games/fruit/assets/home-desc.png');
    game.load.image('home-mask', '/games/fruit/assets/home-mask.png');
    game.load.image('logo', '/games/fruit/assets/logo.png');
    game.load.image('lose', '/games/fruit/assets/lose.png');
    game.load.image('new-game', '/games/fruit/assets/new-game.png');
    game.load.image('ninja', '/games/fruit/assets/ninja.png');
    game.load.image('peach', '/games/fruit/assets/peach.png');
    game.load.image('peach-1', '/games/fruit/assets/peach-1.png');
    game.load.image('peach-2', '/games/fruit/assets/peach-2.png');
    game.load.image('quit', '/games/fruit/assets/quit.png');
    game.load.image('sandia', '/games/fruit/assets/sandia.png');
    game.load.image('sandia-1', '/games/fruit/assets/sandia-1.png');
    game.load.image('sandia-2', '/games/fruit/assets/sandia-2.png');
    game.load.image('score', '/games/fruit/assets/score.png');
    game.load.image('shadow', '/games/fruit/assets/shadow.png');
    game.load.image('smoke', '/games/fruit/assets/smoke.png');
    game.load.image('x', '/games/fruit/assets/x.png');
    game.load.image('xf', '/games/fruit/assets/xf.png');
    game.load.image('xx', '/games/fruit/assets/xx.png');
    game.load.image('xxf', '/games/fruit/assets/xxf.png');
    game.load.image('xxx', '/games/fruit/assets/xxx.png');
    game.load.image('xxxf', '/games/fruit/assets/xxxf.png');
    game.load.bitmapFont('number', '/games/fruit/assets/bitmapFont.png', '/games/fruit/assets/bitmapFont.xml');
  },
  // 跳转到开始界面
  create: function () {
    game.state.start('main');
  }
};
