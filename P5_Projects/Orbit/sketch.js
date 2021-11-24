time = 0

function setup() {
  createCanvas(800, 500);
}

function draw() {
  let diam1 = 200
  let diam2 = 100
  background(5,0,70);
  stroke(100,100,0);
  noFill()
  translate(width/3,height/2)
  ellipse(0,0,diam1)
  ellipse(diam1*cos(time),diam1*sin(time),diam2)
  ellipse(diam2*cos(time),diam2*sin(time),50)
  text("FPS: " +  
    int(frameRate()), 100, 100);
  
  time = time+.01
}