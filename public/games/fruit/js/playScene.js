// 游戏场景：规则计时和物体运动分离，冰冻不会延长自身倒计时
var PlayScene = {
  create: function() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    this.bg = game.add.image(0, 0, 'background');
    this.rules = FruitGameRules.createState();
    this.fruits = [];
    this.remnants = [];
    this.feedback = [];
    this.score = 0;
    this.playing = true;
    this.restartPointer = null;
    this.blade = new Blade({ game: game });
    this.blade.allowBlade();
    this.zh = game.fruitLang === 'zh';
    this.scoreAnim();
    this.scoreTextAnim();
    var font = { font: 'bold 22px Arial, sans-serif', fill: '#ffffff' };
    this.healthText = game.add.text(game.width - 16, 12, '', font);
    this.healthText.anchor.setTo(1, 0);
    this.healthIcon = new PowerUp({ game: game, kind: 'heart', x: game.width - 152, y: 25, displayOnly: true }).sprite();
    this.healthIcon.width = 24;
    this.healthIcon.height = 24;
    this.effectText = game.add.text(game.width - 16, 43, '', { font: '18px Arial, sans-serif', fill: '#b9efff' });
    this.effectText.anchor.setTo(1, 0);
    this.hintText = game.add.text(game.width / 2, 80, '', { font: '18px Arial, sans-serif', fill: '#ffffff' });
    this.hintText.anchor.setTo(0.5, 0);
    this.noticeText = game.add.text(game.width / 2, 115, '', { font: 'bold 24px Arial, sans-serif', fill: '#ffffff' });
    this.noticeText.anchor.setTo(0.5, 0);
    this.noticeUntilMs = 0;
    this.updateHud();
  },
  update: function() {
    if(!this.playing) return;
    this.rules = FruitGameRules.advance(this.rules, game.time.physicsElapsedMS, this.fruits.length > 0);
    this.syncMotion();
    this.updateEffects();
    // 倒序清理，所有漏果都移除，保护期内仅结算一次伤害
    for(var i=this.fruits.length-1; i>=0; i--) {
      var object = this.fruits[i];
      var sprite = object.sprite();
      if(sprite.body.velocity.y > 0 && !sprite.inWorld) {
        this.fruits.splice(i, 1);
        if(object.type === 'fruit') this.onOut(object);
        this.removeObject(object);
        if(!this.playing) return;
      }
    }
    this.rules = FruitGameRules.advance(this.rules, 0, this.fruits.length > 0);
    if(this.fruits.length === 0) this.startFruit();
    this.blade.update();
    var hits = [];
    for(var i=0; i<this.fruits.length; i++) {
      var object = this.fruits[i];
      this.blade.checkCollide(object.sprite(), function(entry) {
        hits.push({ object: object, entry: entry, order: i });
      });
    }
    // 按刀迹首次接触的先后结算，道具可以保护同一刀后续命中的炸弹
    hits.sort(function(a, b) { return a.entry - b.entry || a.order - b.order; });
    for(var i=0; i<hits.length && this.playing; i++) {
      var object = hits[i].object;
      this.fruits.splice(this.fruits.indexOf(object), 1);
      if(object.type === 'fruit') this.onKill(object);
      else if(object.type === 'bomb') this.onBomb(object);
      else this.onPowerUp(object);
    }
    this.updateHud();
  },
  scoreAnim: function() {
    this.scoreImage = game.add.image(8, 8, 'score');
  },
  scoreTextAnim: function() {
    this.scoreText = game.add.bitmapText(75, 40, 'number', '0', 32);
  },
  updateHud: function() {
    this.healthText.text = (this.zh ? '生命 ' : 'Lives ') + this.rules.lives + '/' + FruitGameRules.config.maxLives;
    var effects = [this.zh ? '护盾 ' : 'Shield '];
    effects[0] += this.rules.hasShield ? '1' : '0';
    var remaining = Math.max(0, this.rules.frozenUntilMs - this.rules.elapsedMs);
    if(remaining > 0) effects.push((this.zh ? '冰冻 ' : 'Freeze ') + Math.ceil(remaining / 1000) + 's');
    this.effectText.text = effects.join('  ·  ');
    this.hintText.text = !this.playing ? '' : this.rules.elapsedMs < 15000 ?
      (this.zh ? '热身中 · 暂无炸弹 · 划中道具自动使用' : 'Warm up · No bombs · Slice items to use') : '';
    if(this.rules.elapsedMs >= this.noticeUntilMs) this.noticeText.text = '';
  },
  notify: function(zh, en) {
    this.noticeText.text = this.zh ? zh : en;
    this.noticeUntilMs = this.rules.elapsedMs + 1300;
  },
  startFruit: function() {
    var wave = FruitGameRules.nextWave(this.rules, Math.random);
    this.rules = wave.state;
    for(var i=0; i<wave.spawns.length; i++) this.fruits.push(this.createObject(wave.spawns[i]));
  },
  createObject: function(spawn) {
    var shot = FruitGameRules.launch(spawn.speedTier, this.rules.elapsedMs, game, Math.random);
    var options = { game: game, x: shot.x, y: shot.y };
    var object;
    if(spawn.type === 'fruit') {
      var keys = ['apple', 'banana', 'basaha', 'peach', 'sandia'];
      options.key = keys[Math.floor(Math.random() * keys.length)];
      object = new Fruit(options);
    } else if(spawn.type === 'bomb') {
      object = new Bomb(options);
      // 父sprite本身无纹理，显式设置炸弹实际碰撞范围
      object.sprite().body.setSize(66, 68, -33, -34);
    } else {
      options.kind = spawn.powerUpKind;
      object = new PowerUp(options);
      object.powerUpKind = spawn.powerUpKind;
    }
    object.type = spawn.type;
    object.baseGravity = shot.gravity;
    object.motionScale = 1;
    var body = object.sprite().body;
    body.velocity.x = shot.vx;
    body.velocity.y = shot.vy;
    body.gravity.y = shot.gravity;
    this.applyMotion(object, FruitGameRules.motionScale(this.rules));
    return object;
  },
  applyMotion: function(object, scale) {
    if(object.motionScale === scale) return;
    var body = object.sprite().body;
    var ratio = scale / object.motionScale;
    body.velocity.x *= ratio;
    body.velocity.y *= ratio;
    body.gravity.y = object.baseGravity * scale * scale;
    object.motionScale = scale;
  },
  syncMotion: function() {
    var scale = FruitGameRules.motionScale(this.rules);
    for(var i=0; i<this.fruits.length; i++) this.applyMotion(this.fruits[i], scale);
  },
  removeObject: function(object) {
    if(object.destroy) object.destroy();
    else object.sprite().destroy();
  },
  impact: function(object, color) {
    var bitmap = game.add.bitmapData(96, 96);
    var ctx = bitmap.context;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(48, 48, 36, 0, Math.PI * 2);
    ctx.stroke();
    var sprite = game.add.sprite(object.sprite().x, object.sprite().y, bitmap);
    sprite.anchor.setTo(0.5, 0.5);
    this.feedback.push({ sprite: sprite, bitmap: bitmap, until: this.rules.elapsedMs + 500 });
  },
  updateEffects: function() {
    for(var i=this.feedback.length-1; i>=0; i--) {
      var effect = this.feedback[i];
      effect.sprite.alpha = Math.max(0, (effect.until - this.rules.elapsedMs) / 500);
      if(effect.until <= this.rules.elapsedMs) {
        effect.sprite.destroy();
        if(effect.bitmap.destroy) effect.bitmap.destroy();
        this.feedback.splice(i, 1);
      }
    }
    for(var i=this.remnants.length-1; i>=0; i--) {
      if(this.remnants[i].until <= this.rules.elapsedMs) {
        this.removeObject(this.remnants[i].object);
        this.remnants.splice(i, 1);
      }
    }
  },
  clearEffects: function() {
    for(var i=0; i<this.remnants.length; i++) this.removeObject(this.remnants[i].object);
    this.remnants = [];
    for(var i=0; i<this.feedback.length; i++) {
      this.feedback[i].sprite.destroy();
      if(this.feedback[i].bitmap.destroy) this.feedback[i].bitmap.destroy();
    }
    this.feedback = [];
  },
  onOut: function() {
    var result = FruitGameRules.resolve(this.rules, 'miss');
    this.rules = result.state;
    if(result.damage) this.notify('漏掉水果 -1', 'Missed fruit -1');
    if(this.rules.lives === 0) this.gameOver();
  },
  onKill: function(fruit) {
    fruit.half(this.blade.collideDeg(), true);
    this.remnants.push({ object: fruit, until: this.rules.elapsedMs + 4000 });
    this.score++;
    this.scoreText.text = this.score + '';
  },
  onBomb: function(bomb) {
    var result = FruitGameRules.resolve(this.rules, 'bomb');
    this.rules = result.state;
    this.impact(bomb, result.damage ? '#ff795c' : '#77c5ff');
    this.removeObject(bomb);
    this.notify(result.damage ? '炸弹 -2' : '护盾抵挡了炸弹', result.damage ? 'Bomb -2' : 'Shield blocked the bomb');
    if(this.rules.lives === 0) this.gameOver();
  },
  onPowerUp: function(object) {
    var result = FruitGameRules.resolve(this.rules, object.powerUpKind);
    this.rules = result.state;
    this.removeObject(object);
    if(object.powerUpKind === 'heart') this.notify(result.applied ? '生命 +1' : '生命已满', result.applied ? 'Life +1' : 'Lives full');
    else if(object.powerUpKind === 'shield') this.notify('护盾已就绪', 'Shield ready');
    else this.notify('冰冻 5 秒', 'Freeze for 5 seconds');
    this.syncMotion();
  },
  gameOver: function() {
    if(!this.playing) return;
    this.playing = false;
    for(var i=0; i<this.fruits.length; i++) this.removeObject(this.fruits[i]);
    this.fruits = [];
    this.clearEffects();
    this.updateHud();
    this.gameOverSprite = game.add.sprite(game.width / 2, game.height / 2, 'game-over');
    this.gameOverSprite.anchor.setTo(0.5, 0.5);
    this.restartText = game.add.text(game.width / 2, game.height / 2 + 60,
      this.zh ? '点击或轻触，返回首页' : 'Click or tap to return to the menu',
      { font: '20px Arial, sans-serif', fill: '#ffffff' });
    this.restartText.anchor.setTo(0.5, 0.5);
    game.input.onDown.add(this.armRestart, this);
    game.input.onUp.add(this.restartGame, this);
  },
  armRestart: function(pointer) {
    this.restartPointer = pointer;
  },
  restartGame: function(pointer) {
    if(pointer !== this.restartPointer || !this.restartPointer) return;
    this.restartPointer = null;
    game.input.onDown.remove(this.armRestart, this);
    game.input.onUp.remove(this.restartGame, this);
    game.state.start('main');
  },
  shutdown: function() {
    this.playing = false;
    game.input.onDown.remove(this.armRestart, this);
    game.input.onUp.remove(this.restartGame, this);
    this.restartPointer = null;
    for(var i=0; i<this.fruits.length; i++) this.removeObject(this.fruits[i]);
    this.fruits = [];
    this.clearEffects();
  }
};
