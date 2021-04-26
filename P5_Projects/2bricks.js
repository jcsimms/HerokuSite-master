class Bricks {

  constructor(x, y, bw, red, green, blue) {
    this.x = x
    this.y = y
    this.bw = bw
    this.red = red
    this.green = green
    this.blue = blue
    this.gone = false
    
  }
  show() {
    fill(this.red, this.green, this.blue)
    rect(this.x, this.y, this.bw, brickHeight)
  }
  smash(){
    this.gone = true
  }
}