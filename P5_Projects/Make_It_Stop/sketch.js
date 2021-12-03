let faceX = 0
let faceY = 0
let r = 0

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);

  textSize(90);
  text('Make it stop please', 400, 240);

  if(mouseX == 400){
    textSize(90);
    fill(255, 255, 0)
    text('THANK YOU!!', 400, 360);
  }
  fill(0, 102, 153);  translate(200,200)

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
  strokeWeight(5)

}