let snake;
let rez = 20;
let food;
let w;
let h;
let score = 0

function setup() {
  windowWidth
  createCanvas(600, 600
  );
  w = floor(width / rez);
  h = floor(height / rez);
  frameRate(5);
  snake = new Snake();
  foodLocation();
}

function foodLocation() {
  let x = floor(random(w));
  let y = floor(random(h));
  food = createVector(x, y);

}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    snake.setDir(-1, 0);
  } else if (keyCode === RIGHT_ARROW) {
    snake.setDir(1, 0);
  } else if (keyCode === DOWN_ARROW) {
    snake.setDir(0, 1);
  } else if (keyCode === UP_ARROW) {
    snake.setDir(0, -1);
  } else if (key == ' ') {
    snake.grow();
  }

}

function draw() {
  scale(rez);
  background(20, 200, 0);
  if (snake.eat(food)) {
    foodLocation();
      score = score+1
  }
  snake.update();
  snake.show();
textSize(1);
text('Your Score: '+score, 10, 10);
fill(0, 102, 153);



  if (snake.endGame()) {
        background(255, 0, 0);
    fill(0,0,255)
textAlign(CENTER)
    text("YA DONE GOOFED",width/2,height/2);
    noLoop();
  }

  noStroke();
  fill(255, 0, 0);
  rect(food.x, food.y, 1, 1);
}