//              background(20,30,40);
// light blue     fill(137, 207, 240)
// Gold           fill(255,161,29)
//




function setup() {
  createCanvas(1890, 2000);
  birthday = "";
  thisD = day();
  thisM = month();
  thisY = year();
  milDay = 86400000;
  background(20,30,40);
  textSize(32);
  fill(137, 207, 240)
  text("Give me your birthday and I'll show you your entire life", 80, 80);
  textSize(22);
  noStroke()
  rect(330,180,45,10)
  triangle(370, 175, 370, 195, 390, 185);
  text("Days behind you", 150, 190);
  fill(255,161,29)
  rect(670,180,45,10)
  triangle(370+295+10, 175, 370+295+10, 195, 645+10, 185);
  text("Days yet to be lived!", 740, 190);
  datePicker = select("#birthday");
  datePicker.position(870, 60);
  button = createButton("go");
  button.position(1050, 60);
  button.mousePressed(gimme);
  bracket_a = 340
  bracket_b = 150
  fives = 5
  exampleGap = 430

//Year Brackets
for (var i = 0; i < 20; i++) {
  noFill();
  stroke(137, 207, 240)
  arc(60, bracket_a, 20, 71, HALF_PI, PI+HALF_PI)
  fill(255)
  stroke(137, 207, 240)
  ellipse(40, bracket_a,35,18)
  fill(0)
  textSize(10);
  textAlign(CENTER, CENTER);
  text((fives-5) + " - " +(fives-1),40,bracket_a)
  fives = fives+5
  bracket_a = bracket_a + 75
}

//Month Brackets
for (var ii = 0; ii < 12; ii++) {
  noFill();
  arc(bracket_b, 295, 139, 40, PI, 0)
  fill(255)
  ellipse(bracket_b,275,55,18)
  fill(0)
  textSize(10);
  textAlign(CENTER, CENTER);
  fill(20,30,40)
  if(ii == 0){
    text("January",bracket_b, 275)
  }
  else if(ii == 1){
    text("February",bracket_b, 275)
  }
  else if(ii == 2){
    text("March",bracket_b, 275)
  }
  else if(ii == 3){
    text("April",bracket_b, 275)
  }
  else if(ii == 4){
    text("May",bracket_b, 275)
  }
  else if(ii == 5){
    text("June",bracket_b, 275)
  }
  else if(ii == 6){
    text("July",bracket_b, 275)
  }
  else if(ii == 7){
    text("August",bracket_b, 275)
  }
  else if(ii == 8){
    text("September",bracket_b, 275)
  }
  else if(ii == 9){
    text("October",bracket_b, 275)
  }
  else if(ii == 10){
    text("November",bracket_b, 275)
  }
  else if(ii == 11){
    text("December",bracket_b, 275)
  }
  bracket_b = bracket_b + 143
}

//Example Bars
for (var iii = 0; iii < 7; iii++) {
  if(iii<4){
    fill(137, 207, 240)
  }else{
    fill(255,161,29)
  }
  noStroke()
  rect(exampleGap,155,15,60)
  translate(exampleGap+12,145)
  rotate(PI / -3.0)
  textAlign(LEFT)
  if(iii == 0){
  text("Sunday",0,0)
  }
  else if(iii == 1){
  text("Monday",0,0)
  }
  else if(iii == 2){
  text("Tuesday",0,0)
  }
  else if(iii == 3){
  text("Wednesday",0,0)
  }
  else if(iii == 4){
  text("Thursday",0,0)
  }
  else if(iii == 5){
  text("Friday",0,0)
  }
  else if(iii == 6){
  text("Saturday",0,0)
  }
  rotate(PI / 3.0)
  translate(-exampleGap-12,-145)
  exampleGap = exampleGap + 30


}

}
function gimme() {
  deathDay = random(75 * 365, 100 * 365);
  birthday = document.getElementById("birthday").value; //2021-05-19
  today = new Date()
  td_ms = today.getTime();
  bd_lf = new Date(birthday);
  bd_ms = bd_lf.getTime();
  ny_lf = new Date(birthday.slice(0, 4), 0, 01); //Fri Jan 01 2021 00:00:00 GMT-0400
  ny_ms = ny_lf.getTime(); //1609473600000
  
  days = [];
  x = 80;
  y = 305;
  r = 20
  g = 30
  b = 40
  d = ny_lf.getDate();
  wd = ny_lf.getDay() + 1;
  m = ny_lf.getMonth() + 1;
  yr = ny_lf.getYear() + 1900;
  ms = ny_ms - milDay;
  firstDay = new Date(ms);
  thisDay = firstDay;

  for (var i = 0; i < deathDay; i++) {
    days[i] = new Days(x, y, r, g, b, d, wd, m, yr, ms, thisDay);

    ms = ms + milDay;
    thisDay = new Date(ms);
    d = thisDay.getDate();
    wd = thisDay.getDay() + 1;
    m = thisDay.getMonth() + 1;
    yr = thisDay.getYear() + 1900;


    //              background(20,30,40);
// light blue     fill(137, 207, 240)
// Gold           fill(255,161,29)
    
    if (ms < bd_ms){
      r = 20
      g = 30
      b = 40
    }else if(ms > bd_ms && ms < td_ms){
      r = 137
      g = 207
      b = 240
    }else if(ms == td_ms){
      r = 255
      g = 255
      b = 0
    }else if(ms > td_ms){
      r = 255
      g = 161
      b = 29
    }else{
      r = 20
      g = 30
      b = 40
    }
    
    if (m == 12 && d == 31) {
      y = y + 15;
      x = 80;
    } else if (wd == 1) {
      x = x + 9;
    } else {
      x = x + 4;
    }
  }

  for (var i = 0; i < deathDay; i++) {
    days[i].show();
  }
  print(thisD, thisM, thisY, days[127], days[128], days[129]);
}

