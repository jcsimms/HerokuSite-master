function Days(x, y, r, g, b, d, wd, m, yr, ms, thisDay) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.g = g;
  this.b = b;
  this.d = d;
  this.wd = wd;
  this.m = m;
  this.yr = yr;
  this.ms = ms;
  this.thisDay = thisDay;
  this.show = function (x, y) {
    noStroke();
    fill(this.r, this.g, this.b);
    rect(this.x, this.y, 2, 8);
  };
  this.move = function(){    
    this.x = this.x + random(-4, 4)
    this.y = this.y + random(-4, 4)
  }
}