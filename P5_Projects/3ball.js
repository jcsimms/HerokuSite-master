class Ball {

    constructor() {
      this.x = width/2
      this.y = height-120
      this.direction = -10
      this.rad = 20
    }
    
    show() {
      fill(200,20,255)
      ellipse(this.x,this.y,this.rad*2)
    }
    
    hits(bricks) {
        if (this.x+this.rad > bricks.x && this.x-this.rad < bricks.x+bricks.bw && (this.y-this.rad < bricks.y+brickHeight && this.y+this.rad > bricks.y)){
            return true
        } else {
            return false
        }
    }
    bounce(){
        this.direction = this.direction*-1
    }
    
    fire() {
        ellipse(this.x,this.y,40)
        this.y = this.y+this.direction
        this.x = this.x-((derivX/10)*-1)

        if (this.y < 0){
            this.direction = 10
        }
        if (this.y > height-120 && this.y < height-100 && this.x > mouseX-200 && this.x < mouseX+200){
            this.direction = -10
        }
        if (this.x < 0 || this.x > width){
            derivX = derivX*-1
        }
        if (derivX > 0 && this.x < mouseX-120 && this.x > mouseX-200 && this.y > height-120 && this.y < height-100){
            derivX = derivX-ang
        }
        if (derivX < 0 && this.x < mouseX-120 && this.x > mouseX-200 && this.y > height-120 && this.y < height-100){
            derivX = derivX-ang
        }
        if (derivX > 0 && this.x > mouseX+120 && this.x < mouseX+200 && this.y > height-120 && this.y < height-100){
            derivX = derivX+ang
        }
        if (derivX < 0 && this.x > mouseX+120 && this.x < mouseX+200 && this.y > height-120 && this.y < height-100){
            derivX = derivX+ang
        }
    }
}