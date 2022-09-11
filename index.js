/** @type {HTMLCanvasElement} */
const gCanvas = document.getElementById('gameCanvas');
const gCanvasContext = gCanvas.getContext('2d');

const CANVAS_WIDTH = gCanvas.width = window.innerWidth;
const CANVAS_HEIGHT = gCanvas.height = window.innerHeight;

let timeToNextEnemy = 2000;
let timeToNextEnemyAccumulator = 0;

let enemies = [];

let lastTimestamp = 0;

let isFirstGame = true;
let isGameOver = true;

let score = 0;

class Enemy {
  constructor(width, height, imageSource, imageCount, sizeFactor, animationSpeed, audioFile) {
    this.currentFrame = 0;
    this.width = width;
    this.height = height;
    this.imageCount = imageCount;
    this.frameCount = 0;
    this.size = Math.random() * 3 + sizeFactor;
    this.animationSpeed = animationSpeed;
    this.x = CANVAS_WIDTH;
    this.y = Math.random() * (CANVAS_HEIGHT - height/this.size);

    this.image = imageSource;

    this.directionX = Math.random() * 2 + 1;
    this.deleted = false;

    this.sound = new Audio();
    this.sound.src = audioFile;
    this.soundPlayed = false;
  }

  draw() {
    gCanvasContext.drawImage(
      this.image,
      this.currentFrame * this.width, 0, this.width, this.height,
      this.x, this.y, this.width/this.size, this.height/this.size
    );

    if (!this.soundPlayed && this.currentFrame === 0) {
      this.soundPlayed = true;
      this.sound.play();
    }
  }

  update(deltaTime) {
    this.frameCount += deltaTime;
    if (this.frameCount > this.animationSpeed) {
      this.currentFrame += 1;
      this.frameCount = 0;
    }
    this.x -= this.directionX;

    if (this.x < 0 - this.width) {
      this.deleted = true;
    }

    if (this.currentFrame >= this.imageCount) {
      this.currentFrame = 0;
    }

    if (this.x < 0) {
      isGameOver = true;
    }
  }
}

class Bat extends Enemy {
  constructor() {
    super(492, 409, bat, 2, 3, 100, './assets/bat_sound.flac');
    this.directionY = Math.sin(Math.random() * 6.2);
    this.horizontalSpeed = 100;
    this.horizontalSpeedAccumulator = 0;
  }
  
  update(deltaTime) {
    super.update(deltaTime);
  
    this.horizontalSpeedAccumulator += deltaTime;
    this.y -= this.directionY;
  
    if (this.horizontalSpeedAccumulator > this.horizontalSpeed) {
      this.directionY = Math.sin(Math.random() * 6.2);
      this.horizontalSpeedAccumulator = 0;
    }

    if (this.y < 0 || (this.y + this.height) > CANVAS_HEIGHT) {
      this.directionY *= -1;
    }
  }
}

class Bee extends Enemy {
  constructor() {
    super(275, 284, bee, 13, 2, 30, './assets/bee.wav');
    this.angle = Math.random() * 2;
    this.angleSpeed = Math.random() * 1;
    this.curveProminence = Math.random() * 7;
  }

  update(deltaTime) {
    super.update(deltaTime);

    this.angle += this.angleSpeed;
    this.y += this.curveProminence * Math.sin(this.angle);

    if ((this.y + this.height) < 0 || this.y > CANVAS_HEIGHT) {
      this.deleted = true;
    }
  }
}

class Dragon extends Enemy {
  constructor() {
    super(817, 679, dragon, 4, 5, 200, './assets/dragon.wav');
    this.swipeYSpeed = Math.random() * 2000 + 2000;
    this.swipeYSpeedAcc = 0;
    this.directionY = 1;
    this.velocityY = Math.random() * 25;
    this.moveCount = Math.random() * 100 + 10;
    this.moveCountReduction = Math.random() * 4 + 1;
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (this.y < 0 || (this.y + (this.height/this.size)) > CANVAS_HEIGHT) {
      this.directionY *= -1;
    }

    if (this.swipeYSpeedAcc > this.swipeYSpeed) {
      if (this.moveCount > 0) {
        this.y = this.y + (this.velocityY * this.directionY);
        this.moveCount -= this.moveCountReduction;
      } else {
        this.swipeYSpeedAcc = 0;
        this.moveCount = Math.random() * 50 + 10;
        this.directionY *= -1;
      }
    } else {
      this.swipeYSpeedAcc += deltaTime ;
    }
  }
}

class Explosion {
  constructor(x, y, size) {
    this.size = size;
    this.image = boom;
    this.frameCount = 0;
    this.totalFrames = 3;
    
    this.spriteWidth = 624.5;
    this.spriteHeight = 517;
    
    this.width = this.spriteWidth/this.size;
    this.height = this.spriteHeight/this.size;
    this.x = x - (this.width * 0.5);
    this.y = y - (this.height * 0.5);

    this.animationSpeed = 100;
    this.animationSpeedAcc = 0;

    this.deleted = false;
    this.sound = new Audio();
    this.sound.src = './assets/boom.wav';
  }

  draw() {
    gCanvasContext.drawImage(
      this.image,
      this.frameCount * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
      this.x, this.y, this.width, this.height
    );
    this.sound.play();
  }

  update(deltaTime) {
    this.animationSpeedAcc += deltaTime;

    if (this.animationSpeedAcc > this.animationSpeed) {
      this.frameCount++;
      this.animationSpeedAcc = 0;
    }

    if (this.frameCount > this.totalFrames) {
      this.deleted = true;
    }
  }
}

const enemiesType = [Bat, Bee, Dragon];
// const enemiesType = [Dragon, Dragon, Dragon];

window.addEventListener('click', (e) => {
  if (isGameOver) {
    isGameOver = false;
    timeToNextEnemy = 2000;
    animate(0);
  } else {
    const { x, y } = e;
    enemies.forEach(enemy => {
      if (
        x > enemy.x && x < (enemy.x + (enemy.width/enemy.size))
        && y > enemy.y && y < (enemy.y + (enemy.height/enemy.size))
      ) {
        score++;
        enemy.deleted = true;
        enemies.push(new Explosion(x, y, enemy.size));

        if (score % 5 === 0 && score !== 0) {
          if (timeToNextEnemy > 400) {
            timeToNextEnemy -= 200;
          } else {
            enemy.directionX += 5;
          }
        }
      }
    })
  }
});

const drawGameOver = () => {
  score = 0;
  enemies = [];
  gCanvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (isFirstGame) {
    gCanvasContext.font = "60px Comic Sans MS";
    gCanvasContext.fillStyle = "red";
    gCanvasContext.textAlign = "center";
    gCanvasContext.fillText("Click to play!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    isFirstGame = false;
  } else {
    gCanvasContext.font = "60px Comic Sans MS";
    gCanvasContext.fillStyle = "red";
    gCanvasContext.textAlign = "center";
    gCanvasContext.fillText("Game Over.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    gCanvasContext.fillText("Click to play!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
  }
}

const drawScore = () => {
  if (!isGameOver) {
    gCanvasContext.font = "40px Arial";
    gCanvasContext.fillText(`Score: ${score}`, 150, 50);
  }
};

const animate = (timestamp) => {
  let deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  gCanvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawScore();

  timeToNextEnemyAccumulator += deltaTime;
  if (timeToNextEnemyAccumulator > timeToNextEnemy) {
    const enemyClass = enemiesType[Math.floor(Math.random() * 3)];
    enemies.push(
      new enemyClass()
    );
    timeToNextEnemyAccumulator = 0;
  }

  for(let i = 0; i < enemies.length; i++) {
    if (enemies[i].deleted) {
      enemies[i].sound.pause();
      enemies.splice(i, 1);
      i--;
    }
  }

  enemies.forEach(enemy => enemy.draw());
  enemies.forEach(enemy => enemy.update(deltaTime));
  
  if (isGameOver) {
    drawGameOver();
  } else {
    requestAnimationFrame(animate);
  }
};

animate(0);