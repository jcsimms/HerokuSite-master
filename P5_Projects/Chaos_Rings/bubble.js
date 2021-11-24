class Bubble {
  constructor(x, y, r, red, green, blue) {
    this.x = x
    this.y = y
    this.r = r
    this.red = red
    this.green = green
    this.blue = blue
  }
  show() {
    noFill()
    strokeWeight(10)
    stroke(this.red, this.green, this.blue)
    ellipse(this.x, this.y, this.r)
  }
  move() {
    this.x = this.x + random(-10, 10)
    this.y = this.y + random(-10, 10)
  }
}