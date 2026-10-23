/*
  new Blade({
    game: game
  });
*/
var Blade = function(envConfig) {
  var game = envConfig.game;
  var points = [];
  var blade = new Phaser.Polygon();
  var graphics = game.add.graphics(0, 0);
  var POINTLIFETIME = 200;
  var allowBlade = false;
  var lastPoint = null;
  var pointer = null;
  var timeDown = 0;
  var totalTouches = 0;
  var lastSample = null;
  var segment = null;
  var collisionSegment = null;
  var lastUpdateTime = game.time.time;

  var resetStroke = function() {
    points = [];
    lastPoint = null;
    lastSample = null;
    segment = null;
    collisionSegment = null;
    pointer = null;
  };
  var addPoint = function(point, now) {
    point.time = now;
    points.push(point);
    lastPoint = point;
  };
  var update = function() {
    if(!allowBlade) {
      return;
    }
    var now = game.time.time;
    graphics.clear();
    segment = null;
    collisionSegment = null;
    if(pointer && (!pointer.isDown || pointer.timeDown != timeDown || pointer.totalTouches != totalTouches)) {
      resetStroke();
    }
    if(!pointer) {
      var activePointer = game.input.activePointer;
      if(activePointer && activePointer.isDown) {
        pointer = activePointer;
        timeDown = pointer.timeDown;
        totalTouches = pointer.totalTouches;
        // 新按下才补齐首帧移动；不能回放进入场景前的手势
        var start = timeDown >= lastUpdateTime ? pointer.positionDown : pointer;
        lastSample = new Phaser.Point(start.x, start.y);
        addPoint(new Phaser.Point(start.x, start.y), now);
      }
    }
    while(points.length > 0 && now - points[0].time > POINTLIFETIME) {
      points.shift();
    }
    if(points.length == 0) {
      lastPoint = null;
    }
    if(pointer) {
      var point = new Phaser.Point(pointer.x, pointer.y);
      if(point.x != lastSample.x || point.y != lastSample.y) {
        // 碰撞使用本帧移动，历史刀光仅用于显示
        segment = { start: lastSample, end: point };
        lastSample = point;
        var dx = lastPoint ? lastPoint.x - point.x : 0;
        var dy = lastPoint ? lastPoint.y - point.y : 0;
        if(!lastPoint || dx * dx + dy * dy > 300) {
          addPoint(point, now);
        }
      }
    }
    lastUpdateTime = now;
    if(points.length > 0) {
      blade.setTo(mathTool.generateBlade(points));
      graphics.beginFill(0xffffff);
      graphics.drawPolygon(blade.points);
      graphics.endFill();
    }
  };
  var checkCollide = function(sprite, onCollide) {
    if(allowBlade && segment && pointer && pointer.isDown &&
      pointer.timeDown == timeDown && pointer.totalTouches == totalTouches &&
      sprite.alive !== false && sprite.body &&
      mathTool.segmentIntersectsRect(segment.start, segment.end, sprite.body)) {
      collisionSegment = segment;
      onCollide();
    }
  };
  var collideDeg = function() {
    if(!collisionSegment) {
      return 0;
    }
    var dx = collisionSegment.end.x - collisionSegment.start.x;
    var dy = collisionSegment.end.y - collisionSegment.start.y;
    var deg = Math.round(Math.atan2(dy, dx) / Math.PI * 180);
    return (deg + 180) % 180;
  };
  //导出
  this.allowBlade = function() {
    resetStroke();
    lastUpdateTime = game.time.time;
    allowBlade = true;
  };
  this.update = update;
  this.checkCollide = checkCollide;
  this.collideDeg = collideDeg;
};
