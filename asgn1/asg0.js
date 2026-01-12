//  asg0.js (c) 2012 matsuda

//Global Variables
let canvas;
let ctx;
let v1;
let v2;
let bool = 0;

function main() {  
  // Retrieve <canvas> element
  canvas = document.getElementById('cnv1');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  ctx = canvas.getContext('2d');

  // Draw a blue rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0, canvas.width, canvas.height);        // Fill a rectangle with the color

  handleDrawEvent();
  //drawVector(v1, "red");
}

function angleBetween(v1, v2) {
    // Dot product
    let dotProd = Vector3.dot(v1, v2);
    
    // Angle in radians
    let angleRad = Math.acos(dotProd);

    // Convert to degrees
    let angleDeg = angleRad * 180 / Math.PI;

    return angleDeg;
}

function areaTriangle(v1, v2) {
    // Cross producto
    let crossVec = Vector3.cross(v1, v2);

    // The z-component is the area of the parallelogram
    let parArea = Math.abs(crossVec.elements[2]);

    // Triangle area = half of parallelogram
    let triangleArea = parArea / 2;

    return triangleArea;
}


function handleDrawEvent(){
  // Clear canvas and redraw
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Initializing
  let x1 = document.getElementById("v1x").value;
  let y1 = document.getElementById("v1y").value;
  
  let x2 = document.getElementById("v2x").value;
  let y2 = document.getElementById("v2y").value;

  let operation = document.getElementById("op-select").value;
  let scalar = document.getElementById("scalar").value

  // Print Statements
  console.log("Button Clicked!");
  console.log("v1:", x1, y1);
  console.log("v2:", x2, y2);
  console.log("Operation:", operation);
  console.log("Scalar:", scalar);

  // Vectors
  v1 = new Vector3([x1, y1,0]);
  v2 = new Vector3([x2, y2,0]);
  v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
  v4 = new Vector3([v2.elements[0], v2.elements[1],v2.elements[2]]);
  
  // Handling Operations
  if(operation === "add"){
    v3.add(v2);
  }
  else if(operation === "sub"){
    v3.sub(v2);
  }
  else if(operation === "mult"){
    v3.mul(scalar);
    v4.mul(scalar);
    bool = 1;
  }
  else if(operation === "div"){
    v3.div(scalar);
    v4.div(scalar);
    bool = 1;
  }
  else if(operation === "mag"){
    let v1Mag = v1.magnitude();
    let v2Mag = v2.magnitude();

    console.log("Magnitude v1:", v1Mag);
    console.log("Magnitude v2:", v2Mag);
  }
  else if(operation === "norm"){
    v3.normalize();
    v4.normalize();
    bool = 1;
  }
  else if(operation === "dot"){
    let angle = angleBetween(v1,v2);
    
    console.log("Angle:", angle);
  }
  else if(operation === "area"){
    let area = areaTriangle(v1,v2);

    console.log("Area of the triangle:", area);
  }

  drawVector(v1, "red");
  drawVector(v2, "blue");
  if(bool == 1){
    drawVector(v3, "green");
    drawVector(v4, "green");
    bool = 0;
  }
}

function drawVector(v, color){
  ctx.strokeStyle = color;

  let cx = canvas.width/2;
  let cy = canvas.height/2;

  let xOff = v.elements[0] * 20; // Offsets for x and y
  let yOff = v.elements[1] * 20;

  ctx.beginPath();
  ctx.moveTo(cx,cy);
  ctx.lineTo(cx + xOff, cy - yOff);
  ctx.stroke();
}