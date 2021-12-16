let bricks = [];
let x = 0;
let y = 20;
let brickNum = 30;
let brickHeight = 50;
let brickRows = 3;
let gap = 120

let shipFire = false;
let ship;
let shipX;

let ballFire = false;
let ball = [];
let derivX;
let derivY;
let ang = 50

let timerRun = false
let timer = 0


function setup() {
  
  createCanvas(windowWidth, windowHeight);
  
  let brickNumd = (Math.floor(brickNum/brickRows));
  let brickWidth = (width/(brickNumd))
  let shipX = width/2-200

  ship = new Ship(shipX)
  ball = new Ball()

  for (var i = 0; i < (brickNumd*brickRows)+1; i++) {
    bricks[i] = new Bricks(x, y, brickWidth, random(10,250), random(10,250), random(10,250));
    if (x < width - brickWidth){
      x = x + brickWidth 
    } else if (y < (brickHeight+20)*brickRows) {
      y = y + brickHeight + gap
      x = 0
    } if (i == (brickNumd*3)-1){
      x=-100
      y=-100
    }
  }
}

function draw() {
  background(100); 

//Make the bricks and keep track of them
  for (var i = 0; i < bricks.length; i++) {
    bricks[i].show()
    if(ball.hits(bricks[i])){
      ball.bounce()
      bricks.splice(i,1)
    }
  } 

//Show the ball and ship and wait until the click to fire them
  if (ballFire === false){
    ball.show()
    ship.show()
  } 
  else if (ballFire === true && timerRun === true){
    ball.fire()
    ship.fire()
    if (frameCount % 6 == 0 && timer >= 0) {
      timer = timer + (1/10)
    }
    textAlign(CENTER, CENTER);
    textSize(50);
    text(timer.toFixed(1),width/2, height/2);
  }

//The winning screen
  if (bricks.length < 1){
    fill(200,200,200);
    rect(width/4,height/4,width/2,height/2,20)
    fill(01, 102, 153);
    textAlign(CENTER);
    textSize(100);
    text(timer.toFixed(1), width/2,height/2.4);
    text('Seconds', width/2,height/1.9);
    textSize(30);
    text('Your Score Has Been Recorded!', width/2,height/1.6);
    text('Click Anywhere to Play Again', width/2,height/1.5);
    ball.x = -100
    ball.y = -100
    timerRun = false
    noLoop();
    document.getElementById('score').innerHTML = timer.toFixed(1);
    document.getElementById('score').style.display = 'none'; 
  }

//The losing screen
  if (ball.y > height-50){
    fill(30);
    rect(width/4,height/4,width/2,height/2,20)
    fill(01, 102, 153);
    textAlign(CENTER);
    textSize(100);
    text('OOOOF...', width/2,height/2);
    textSize(25);
    text('Your Failure to Succed Has Been Recorded', width/2,height/1.6);
    text('Click Anywhere to Play Again', width/2,height/1.5);
    noLoop();
    document.getElementById('score').innerHTML = 'Failure';
    document.getElementById('score').style.display = 'none'; 
  }
}

function mouseClicked(){

  if (ballFire === false){
    derivX = mouseX-width/2
    ballFire = true;
    shipFire = true;  
    timerRun = true;
    loop();
  }
  else if (ballFire === true){
    ballFire = false 
    shipFire = false;            
    x = 0;
    y = 20;
    brickNum = 30;
    brickHeight = 50;
    brickRows = 3;
    gap = 120;
    timer = 0;
    setup()
    draw()
    loop();
  }
}
