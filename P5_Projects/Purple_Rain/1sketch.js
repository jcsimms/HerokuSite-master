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
  for (var i = 0; i < bricks.length; i++) {
    bricks[i].show()
    if(ball.hits(bricks[i])){
      ball.bounce()
      bricks.splice(i,1)
    }
  } 
  if (ballFire === false){
    ball.show()
    ship.show()
  } else {
    ball.fire()
    ship.fire()
  }

  if (bricks.length < 2){
    fill(random(150,250), random(150,250), random(150,250));
    rect(width/4,height/4,width/2,height/2,20)
    fill(01, 102, 153);
    textAlign(CENTER);
    textSize(100);
    text('AMAZING!', width/2,height/2);
    ball.x = -100
    ball.y = -100
  }
  else if (ball.y > height-50){
    let dim = 1
    fill(dim);
    dim = dim+10
    rect(width/4,height/4,width/2,height/2,20)
    fill(01, 102, 153);
    textAlign(CENTER);
    textSize(100);
    text('OOOOF...', width/2,height/2);
  }
  // fill(200,200,153);
  // textSize(25);
  // text(ball.y-120, 80,600);
} 

function keyPressed(){
  if (keyCode === 32 && ballFire === false){
    derivX = mouseX-width/2
    ballFire = true
  }else if (keyCode === 32 && ballFire === true){
    ballFire = false 
    shipFire = false;
    // ship.reset()
    // ball.reset()
    // bricks.reset()               
    x = 0;
    y = 20;
    brickNum = 25;
    brickHeight = 50;
    brickRows = 3;
    gap = 120
    setup()
    draw()
  }
} 
