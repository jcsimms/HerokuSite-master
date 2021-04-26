function Ship(x) {
    this.x = x
    this.line = height-200

    this.show = function(){
        fill(200,20,255)
        line(this.x+200,height-120,map(mouseX, width/2-100, width/2+100, width/2-100, width/2+100, true),this.line)
        rect(this.x,height-100,400,40)
    }
    this.fire = function(){
        fill(200,20,255)
        rect(mouseX-200,height-100,400,40)
    }
  }