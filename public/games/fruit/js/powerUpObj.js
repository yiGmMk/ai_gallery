var PowerUp = function(env) {
  var game = env.game;
  var key = 'fruit-power-up-' + env.kind;
  var bitmap = game.cache.getBitmapData(key);
  if(!bitmap) {
    bitmap = game.add.bitmapData(64, 64);
    var ctx = bitmap.context;
    var colors = { heart: '#f05276', shield: '#438ce8', freeze: '#25b5c4' };
    ctx.fillStyle = colors[env.kind];
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, 32, 29, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    if(env.kind === 'heart') {
      ctx.moveTo(32, 48);
      ctx.bezierCurveTo(7, 32, 17, 12, 32, 25);
      ctx.bezierCurveTo(47, 12, 57, 32, 32, 48);
      ctx.fill();
    } else if(env.kind === 'shield') {
      ctx.moveTo(32, 15);
      ctx.lineTo(46, 21);
      ctx.lineTo(44, 36);
      ctx.quadraticCurveTo(41, 45, 32, 50);
      ctx.quadraticCurveTo(23, 45, 20, 36);
      ctx.lineTo(18, 21);
      ctx.closePath();
      ctx.stroke();
    } else {
      for(var i=0; i<6; i++) {
        var angle = i * Math.PI / 3;
        var x = 32 + Math.cos(angle) * 18;
        var y = 32 + Math.sin(angle) * 18;
        ctx.moveTo(32, 32);
        ctx.lineTo(x, y);
        for(var sign=-1; sign<=1; sign+=2) {
          ctx.moveTo(x, y);
          ctx.lineTo(x - Math.cos(angle + sign * 0.6) * 9, y - Math.sin(angle + sign * 0.6) * 9);
        }
      }
      ctx.stroke();
    }
    bitmap.dirty = true;
    game.cache.addBitmapData(key, bitmap);
  }
  var sprite = game.add.sprite(env.x, env.y, bitmap);
  sprite.anchor.setTo(0.5, 0.5);
  if(!env.displayOnly) {
    game.physics.enable(sprite, Phaser.Physics.ARCADE);
    sprite.body.setSize(58, 58, 3, 3);
  }
  this.sprite = function() { return sprite; };
};
