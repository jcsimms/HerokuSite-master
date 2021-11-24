let bubble = [];

function setup() {
  createCanvas(400, 400);
  for (var i = 0; i < 100; i++) {
    bubble[i] = new Bubble(200, 200, 100, random(0, 255), random(0, 255), random(0, 255));
  }
}

function draw() {
  background(160);
  for (var i = 0; i < 100; i++) {
    bubble[i].show()
    bubble[i].move()
  }
}