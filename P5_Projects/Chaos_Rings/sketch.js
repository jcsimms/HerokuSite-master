let bubble = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
    for (var i = 0; i < 400; i++) {
    bubble[i] = new Bubble(windowWidth/2, windowHeight/2, 100, random(0, 255), random(0, 255), random(0, 255));
  }
}

function draw() {
  background(160);
  for (var i = 0; i < 100; i++) {
    bubble[i].show()
    bubble[i].move()
  }
}