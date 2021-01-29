var len = 100
var pos = .82
var ang = 10
var slider;


function setup() {
  createCanvas(1500, 1000);
  slider = createSlider(1, 25, 13, 0);
  slider.position(550, 850);
  slider.style('width', '400px');
}

function draw() {
  background(0, 0, 220);
  tree(750,600)
  tree(-400,300)
  tree(800,100)
}

function tree(x,y){
  stroke(10)
  translate(x, y)
  len = len * 0.8
  branch(100)
  ang = slider.value()
}


function branch(len) {
  stroke(250, 250, 0)
  line(0, 0, 0, -len)
  translate(0, -len)
  if (len > 20) {
    push()
    rotate(PI / ang)
    branch(len * pos)
    pop()
    push()
    rotate(PI / -ang)
    branch(len * pos)
    pop()
  }
}