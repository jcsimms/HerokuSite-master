let faceX = 0
let faceY = 0
let r = 0

function setup() {
  createCanvas(800, 550);
}

function draw() {
  background(220);
  translate(200,200)
  face()
  r=r+0.1*((mouseX-400)/100)
}

face = function(){
  rotate(r)
  strokeWeight(20)
  stroke(20, 30, 140)
  fill(100, 200, 50)
  ellipse(faceX, faceY, 200)
  ellipse(faceX - 40, faceY - 30, 20)
  ellipse(faceX + 40, faceY - 30, 20)
  arc(faceX, faceY, 100, 100, 0.5, PI - 0.5)

}