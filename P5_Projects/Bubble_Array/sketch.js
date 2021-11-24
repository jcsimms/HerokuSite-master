var bubble = []

function setup() {
  createCanvas(700, 400);
  for (var i = 0; i < 100; i++) {
    bubble[i] = new Bubble()
  }
}

function draw() {
  background(22);
  for (var i = 0; i < 100; i++) {
    bubble[i].display(i)
    bubble[i].move()
  }
}

function Bubble() {
  this.x = random(60, width - 60)
  this.y = random(60, height - 60)
  this.r = random(20, 120)
  this.g = random(20, 120)
  this.b = random(20, 120)
  this.display = function(i) {
    fill(this.r, this.b, this.g)
    ellipse(this.x, this.y, 25, 25)
    fill(0)
    textAlign(CENTER, CENTER)
    text(i, this.x, this.y)
  }
  this.move = function() {
    this.x = this.x + random(-1, 1)
    this.y = this.y + random(-1, 1)
  }
}