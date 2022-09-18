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

class InputHandler {
  constructor() {
    this.activeKeys = [];

    window.addEventListener('keydown', (e) => {
      const { code } = e;

      if (!this.activeKeys.includes(code)) {
        this.activeKeys.push(code);
      }
    });

    window.addEventListener('keyup', (e) => {
      const { code } = e;

      if (this.activeKeys.includes(code)) {
        this.activeKeys.splice(
          this.activeKeys.indexOf(code),
          1
        );
      }
    });
  }
}

class CrossHair {
  constructor() {
    this.width = 30;
    this.height = 30;

    this.x = CANVAS_WIDTH/2 - this.width/2;
    this.y = CANVAS_HEIGHT/2 - this.height/2;

    this.image = crossHair;
    this.speed = 5;
  }

  draw() {
    gCanvasContext.drawImage(
      this.image,
      0, 0, 1184, 1184,
      this.x, this.y, this.width, this.height
    )
  }

  setInitialposition() {
    this.x = CANVAS_WIDTH/2 - this.width/2;
    this.y = CANVAS_HEIGHT/2 - this.height/2;
  }

  update(keys) {
    if (keys.includes('ArrowUp') && this.y > this.speed) {
      this.y -= this.speed;
    }

    if (keys.includes('ArrowDown') && this.y + this.height < CANVAS_HEIGHT - this.speed) {
      this.y += this.speed;
    }

    if (keys.includes('ArrowLeft') && this.x > this.speed) {
      this.x -= this.speed;
    }

    if (keys.includes('ArrowRight') && this.x + this.width < CANVAS_WIDTH - this.speed) {
      this.x += this.speed;
    }
  } 
}

class Layer {
  constructor(x, y, cropHeight, velocityX, imageWidth, imageHeight, image) {
    this.x = x;
    this.y = y;
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.cropHeight = cropHeight;
    this.velocityX = velocityX;
    this.image = image;

    this.x2 = this.imageWidth;
  }

  draw() {
    gCanvasContext.drawImage(
      this.image,
      0, this.cropHeight, this.imageWidth, this.imageHeight,
      this.x, this.y, this.imageWidth, this.imageHeight
    );
    gCanvasContext.drawImage(
      this.image,
      0, this.cropHeight, this.imageWidth, this.imageHeight,
      this.x2, this.y, this.imageWidth, this.imageHeight,
    );
  }

  update() {
    this.x -= this.velocityX;
    this.x2 -= this.velocityX;

    if (this.x + this.imageWidth < 0) {
      this.x = this.x2 + this.imageWidth - this.velocityX;
    }

    if (this.x2 + this.imageWidth < 0) {
      this.x2 = this.x + this.imageWidth - this.velocityX;
    }
  }
}

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

    if ((this.x + this.width/this.size) < 0) {
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

const handleEnemyClick = (x, y) => {
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

const layers = [
  new Layer(0, 0, 200, 0.1, 2048, 1546, cloudsBkgd),
  new Layer(0, 0, 600, 0.2, 2048, 1546, hillBkgd),
  new Layer(0, 0, -410, 0.5, 2048, 1546, bushesBkgd),
  new Layer(0, 0, -260, 1, 2048, 1546, treesDistantBkgd),
  new Layer(0, 0, 600, 2, 2048, 1546, treesBkgd),
  new Layer(0, 0, 600, 4, 2048, 1546, groundBkgd),
];

let gunPointer = null;
let inputHandler = null;

var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
if (!isMobile) {
  gunPointer = new CrossHair();
  inputHandler = new InputHandler();
}

window.addEventListener('click', (e) => {
  if (isGameOver) {
    if (gunPointer) gunPointer.setInitialposition();
    isGameOver = false;
    timeToNextEnemy = 2000;
    animate(0);
  } else {
    const { x, y } = e;
    handleEnemyClick(x, y);
  }
});

if (!isMobile) {
  window.addEventListener('keydown', (e) => {
    const { code } = e;

    if (code === 'Space') {
      handleEnemyClick(gunPointer.x + gunPointer.width * 0.5, gunPointer.y + gunPointer.height * 0.5)
    }
  });
}

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

const drawBackground = () => {
  gCanvasContext.drawImage(
    plainBkgd,
    0, 0, CANVAS_WIDTH, CANVAS_HEIGHT
  );
};

const animate = (timestamp) => {
  let deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  gCanvasContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawBackground();
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

  [...layers, ...enemies].forEach(item => item.draw());
  [...layers, ...enemies].forEach(item => item.update(deltaTime));

  if (gunPointer) {
    gunPointer.draw();
    gunPointer.update(inputHandler.activeKeys);
  }
  
  if (isGameOver) {
    drawGameOver();
  } else {
    requestAnimationFrame(animate);
  }
};

animate(0);