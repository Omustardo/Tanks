import bar = require('./public/js/alert');
bar.foo();

import express = require('express');
import routes = require('./routes/index');
import http = require('http');
import path = require('path');
import socketio = require('socket.io');

var app = express();
console.log(__dirname);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, './static_assets/views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

import stylus = require('stylus');
//app.use(stylus.middleware(path.join(__dirname, 'public'))); // TODO: CSS stuff with .styl later

// Define base directories for serving static content
app.use("/static_assets", express.static(path.join(__dirname, 'static_assets')));
app.use("/js", express.static(path.join(__dirname, '../client/public/js'))); // Clientside javascript

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes
app.get('/', routes.index);

var server = http.createServer(app);
var io = socketio(server);
server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

var counter = 0;
var BALL_SPEED = 10;
var WIDTH = 1100;
var HEIGHT = 580;
var TANK_INIT_HP = 100;

class GameServer {
  tanks = [];
  balls = Array<Ball>();
  lastBallId = 0;

  constructor() { };

  addTank(tank) {
    this.tanks.push(tank);
  }
  addBall(ball: Ball) {
    this.balls.push(ball);
  }
  removeTank(tankId) {
    this.tanks = this.tanks.filter(function (t) { return t.id != tankId });
  }

  syncTank(newTankData) {
    this.tanks.forEach(function (tank) {
      if (tank.id == newTankData.id) {
        tank.x = newTankData.x;
        tank.y = newTankData.y;
        tank.baseAngle = newTankData.baseAngle;
        tank.cannonAngle = newTankData.cannonAngle;
      }
    });
  }

  syncBalls() {
    var self = this;
    this.balls.forEach(function (ball) {
      self.detectCollision(ball);
      if (ball.x < 0 || ball.x > WIDTH || ball.y < 0 || ball.y > HEIGHT) {
        ball.out = true;
      } else {
        ball.fly();
      }
    });
  }

  //Detect if ball collides with any tank
  detectCollision(ball) {
    var self = this;
    this.tanks.forEach(function (tank) {
      if (tank.id != ball.ownerId
        && Math.abs(tank.x - ball.x) < 30
        && Math.abs(tank.y - ball.y) < 30) {
        //Hit tank
        self.hurtTank(tank);
        ball.out = true;
        ball.exploding = true;
      }
    });
  }

  hurtTank(tank) {
    tank.hp -= 2;
  }

  getData(): any {
    var gameData = {};
    gameData['tanks'] = this.tanks;
    gameData['balls'] = this.balls;

    return gameData;
  }

  cleanDeadTanks() {
    this.tanks = this.tanks.filter(function (t) {
      return t.hp > 0;
    });
  }

  cleanDeadBalls() {
    this.balls = this.balls.filter(function (ball) {
      return !ball.out;
    });
  }

  increaseLastBallId() {
    this.lastBallId++;
    if (this.lastBallId > 1000) {
      this.lastBallId = 0;
    }
  }
}

class Ball {
  id: number;
  ownerId: number;
  alpha;
  x;
  y;
  out: boolean;

  constructor(ownerId, alpha, x, y) {
    this.id = game.lastBallId;
    game.increaseLastBallId();
    this.ownerId = ownerId;
    this.alpha = alpha; //angle of shot in radians
    this.x = x;
    this.y = y;
    this.out = false;
  }

  fly() {
    //move to trayectory
    var speedX = BALL_SPEED * Math.sin(this.alpha);
    var speedY = -BALL_SPEED * Math.cos(this.alpha);
    this.x += speedX;
    this.y += speedY;
  }
}

var game = new GameServer();

io.on('connection', function (client) {
  console.log('User connected');

  client.on('joinGame', function (tank) {
    console.log(tank.id + ' joined the game');
    var initX = getRandomInt(40, 900);
    var initY = getRandomInt(40, 500);
    client.emit('addTank', { id: tank.id, type: tank.type, isLocal: true, x: initX, y: initY, hp: TANK_INIT_HP });
    client.broadcast.emit('addTank', { id: tank.id, type: tank.type, isLocal: false, x: initX, y: initY, hp: TANK_INIT_HP });

    game.addTank({ id: tank.id, type: tank.type, hp: TANK_INIT_HP });
  });

  client.on('sync', function (data) {
    //Receive data from clients
    if (data.tank != undefined) {
      game.syncTank(data.tank);
    }
    //update ball positions
    game.syncBalls();
    //Broadcast data to clients
    client.emit('sync', game.getData());
    client.broadcast.emit('sync', game.getData());

    //I do the cleanup after sending data, so the clients know 
    //when the tank dies and when the balls explode
    game.cleanDeadTanks();
    game.cleanDeadBalls();
    counter++;
  });

  client.on('shoot', function (ball: Ball) {
    game.addBall(new Ball(ball.ownerId, ball.alpha, ball.x, ball.y));
  });

  client.on('leaveGame', function (tankId) {
    console.log(tankId + ' has left the game');
    game.removeTank(tankId);
    client.broadcast.emit('removeTank', tankId);
  });

});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}