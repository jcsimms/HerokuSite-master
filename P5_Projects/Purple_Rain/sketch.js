var cir = {
  x: 0,
  y: 0,
  r: 0,
  g: 0,
  b: 0,
  o: 0,
  s: 10
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0, 0, 0);
  slider = createSlider(0, 255, 10);
  slider.position(windowWidth/2-375, windowHeight*0.9);
  slider.style('width', '750px');
}

function draw() {
  fill(cir.r, cir.g, cir.b, cir.o)
  cir.r = slider.value() + random(0, 70)
  cir.b = slider.value() + random(0, 70)
  cir.x = random(0, width)
  cir.y = random(0, height)
  cir.o = random(40, 100)
  cir.s = cir.s * 1.005
  noStroke()
  ellipse(cir.x, cir.y, cir.s, cir.s)
  if (cir.s > 300) {
    fill(0, 0, 0, 200)
    rect(0, 0, windowWidth, windowHeight)
    cir.s = 10
  }
}