var btn = true
var slide = 140

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(10);
  translate(windowWidth/2, 400)
  if (btn) {
    fill(300, 300, 0, 100)
  } else {
    noFill()
  }
  noStroke()
  triangle(120, 0, -600, -500, -600, 500)
  fill(100)
  ellipse(400, 0, 100 * .66, 100)
  rect(0, -50, 400, 100)
  stroke(22)
  ellipse(75, 0, 100, 150)
  noStroke()
  rect(0, -75, 75, 150)
  stroke(22)
  if (btn) {
    fill(300, 300, 0)
  }
  ellipse(0, 0, 100, 150)
  fill(100, 100, 200)
  rect(slide, -50, 30, 15)
}


function mouseClicked() {
  if (btn) {
    btn = false
    slide = 150
  } else {
    btn = true
    slide = 140
  }

}
