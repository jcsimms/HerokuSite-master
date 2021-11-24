function setup() {
  createCanvas(600, 600);
  angleMode(DEGREES);
}

function draw() {
  translate(width / 2, height / 2)
  background(40);
  noFill()
  seconds()
  minutes()
  hours()
  strokeWeight(15)
  stroke(200)
  point(0, 0)

}

function seconds() {
  let s = second();
  let sangle = map(s, 0, 60, 0, 360)
  strokeWeight(20)
  stroke(250, 0, 0)
  arc(0, 0, 300, 300, -90, sangle - 90)
  stroke(250)
  push()
  rotate(sangle - 90)
  strokeWeight(5)
  line(90, 0, 0, 0)
  pop()

}

function minutes() {
  let m = minute();
  let mangle = map(m, 0, 60, 0, 360)
  strokeWeight(20)
  stroke(0, 250, 0)
  arc(0, 0, 260, 260, -90, mangle - 90)
  stroke(250)
  push()
  rotate(mangle - 90)
  strokeWeight(10)

  line(80, 0, 0, 0)
  pop()
}

function hours() {
  let h = hour() * 2;
  let hangle = map(h, 0, 24, 0, 360)
  strokeWeight(20)
  stroke(0, 0, 250)
  arc(0, 0, 220, 220, -90, hangle - 90)
  stroke(250)
  push()
  strokeWeight(10)

  rotate(hangle - 90)
  line(50, 0, 0, 0)
  pop()
}