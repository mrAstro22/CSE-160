// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  void main() {
    // gl_FragColor = u_FragColor;
    gl_FragColor = vec4(v_UV, 1.0, 1.0);
  }`


// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext('webgl', {preserveDrawingBuffer:true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of a_Position
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if(a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }
}

// Global UI Elements
let g_selectedColor= [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType = "square";
let g_circleSegments = 10;


function UIElements(){
  // Button Events
  document.getElementById('green').onclick = function(){g_selectedColor = [0.0,1.0,0.0,1.0]; }
  document.getElementById('red').onclick = function(){g_selectedColor = [1.0,0.0,0.0,1.0]; }
  document.getElementById('eraser').onclick = function(){g_selectedColor = [0.0,0.0,0.0,1.0]; }

  // Circle Segment Slider Events
  const segSlider = document.getElementById('segSlide');
  const segValue = document.getElementById('segValue');

  // initialize from HTML
  g_circleSegments = parseInt(segSlider.value);
  segValue.textContent = segSlider.value;

  segSlider.addEventListener('input', function () {
    g_circleSegments = parseInt(this.value);
    segValue.textContent = this.value;
  });


  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; })
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; })
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; })

  // Clear Canvas
  document.getElementById('clear').onclick = function() {g_shapesList = []; renderShapes(); }

  // Size Slider Events
  document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value; })

  // Shapes
  document.getElementById('triangles').onclick = function(){g_selectedType = "triangle" }
  document.getElementById('squares').onclick = function(){g_selectedType = "square" }
  document.getElementById('circles').onclick = function(){g_selectedType = "circle" }

  // Recreate Hardcoded Drawing
  document.getElementById('recreateDrawing').onclick = function() {
  for (let s of g_hardcodedShapes) {
    let shape;
    if (s.type === "circle") {
      shape = new Circle();
      shape.segments = s.segments;
    } else if (s.type === "triangle") {
      shape = new Triangle();
    } else if (s.type === "square") {
      shape = new Point();
    }

    shape.postion = s.position.slice();
    shape.color = s.color.slice();
    shape.size = s.size;
    g_shapesList.push(shape);
  }
  renderShapes();
  };
}

function main() {

  // Setup canvas and gl Variables
  setupWebGL();

  // Setup GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Clicking Events for Buttong
  UIElements();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = function(ev){ click(ev)};

  canvas.onmousemove = function(ev){ if(ev.buttons == 1) {click(ev)} };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapesList = [];

// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = []; 

function click(ev) {

  let [x,y] = convertCoords(ev);

  // Create and store new point
  let point;
  if (g_selectedType == "square"){
    point = new Point();
  } else if (g_selectedType == "triangle"){
    point = new Triangle();
  }
  else if (g_selectedType == "circle"){
    point = new Circle();
    point.segments = g_circleSegments;
  }
  point.postion = [x, y, 0.0];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  g_shapesList.push(point);

  // // Store the coordinates to g_points array
  // g_points.push([x, y]);

  // // g_colors.push(g_selectedColor);
  // g_colors.push(g_selectedColor.slice());

  // // Store the size to the g_sizes array
  // g_sizes.push(g_selectedSize);

  // Store the coordinates to g_points array
  // if (x >= 0.0 && y >= 0.0) {      // First quadrant
  //   g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  // } else if (x < 0.0 && y < 0.0) { // Third quadrant
  //   g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  // } else {                         // Others
  //   g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  // }

  renderShapes();
}

// Extract the event click and return it in WebGL coordinates
function convertCoords(ev){
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x-rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x,y]);
}

function renderShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);


  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
}

function logShapes() {
  const simplified = g_shapesList.map(shape => ({
    type: shape.type,
    position: shape.postion,
    color: shape.color,
    size: shape.size,
    segments: shape.segments || null
  }));
  
  console.log(JSON.stringify(simplified, null, 2));
}



const g_hardcodedShapes = [
  {
    "type": "triangle",
    "position": [
      -0.5849553608894348,
      0.1499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5799553608894348,
      0.1449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5799553608894348,
      0.1399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5799553608894348,
      0.13495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5799553608894348,
      0.12995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.12995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.12495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.11495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.10995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.09995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.08995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.07995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.06495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.05995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.049955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.03995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.034955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.029955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.019955360889434816,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.009955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.004955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.000044639110565185544,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.010044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.015044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.025044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.030044639110565187,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.035044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.045044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.050044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.060044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.06504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.07004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.08004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.08504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.09004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.10004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.1350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.1400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.15004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.15504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.16004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.1700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.1750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.18504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.19004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.1950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.2050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.21004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.21504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.2250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.2300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.24004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.24504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.2750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.29004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.29504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.30004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.3050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.3100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.3200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.3250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.3300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.3400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      -0.35004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.35504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.3700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.3750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.3850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.3950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.4050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.42504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.4300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.4400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.4450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.4500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.4550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.4600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.4650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.4700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.47504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.48004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.48004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.48504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.4950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5700446391105651,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5750446391105651,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5800446391105651,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5800446391105651,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5850446391105651,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.5950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      -0.6000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      -0.6000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      -0.6000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5499553608894349,
      -0.6050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      -0.6050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5249553608894348,
      -0.6100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      -0.6100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      -0.6100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4899553608894348,
      -0.6100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4749553608894348,
      -0.6100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.45995536088943484,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.44995536088943483,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4449553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4399553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4349553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4299553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4249553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4249553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4199553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4149553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4099553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4049553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38495536088943483,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3699553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3649553608894348,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3599553608894348,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3549553608894348,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3449553608894348,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32495536088943483,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3199553608894348,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3049553608894348,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2999553608894348,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2899553608894348,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2849553608894348,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.27495536088943484,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.26995536088943484,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.25995536088943483,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2549553608894348,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.24995536088943482,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2349553608894348,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2299553608894348,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21995536088943482,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21495536088943482,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2099553608894348,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1999553608894348,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.19495536088943483,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.18495536088943482,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1799553608894348,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1749553608894348,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.16495536088943483,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.15995536088943482,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.15495536088943482,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1499553608894348,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1449553608894348,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.13495536088943483,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.12995536088943482,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.12495536088943482,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11995536088943481,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10995536088943482,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.09995536088943481,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.08995536088943482,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.08495536088943481,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.07495536088943482,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.06495536088943482,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.05495536088943481,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.049955360889434815,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.04495536088943482,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.03995536088943481,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.034955360889434815,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.029955360889434814,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.019955360889434816,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.014955360889434815,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.009955360889434814,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.004955360889434815,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.000044639110565185544,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.0050446391105651855,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.010044639110565185,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.015044639110565186,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.020044639110565185,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.025044639110565186,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.035044639110565184,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.04004463911056519,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.050044639110565184,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.05504463911056519,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.060044639110565186,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.06504463911056518,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07004463911056519,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07504463911056519,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.08504463911056519,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.09004463911056519,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.09504463911056518,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.10504463911056519,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11504463911056519,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.12504463911056518,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1350446391105652,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1450446391105652,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15004463911056518,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.16004463911056518,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1650446391105652,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1750446391105652,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.18004463911056517,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.19004463911056518,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2000446391105652,
      -0.6500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2050446391105652,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.21504463911056518,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2250446391105652,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2300446391105652,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.24004463911056517,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2500446391105652,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2550446391105652,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2600446391105652,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2700446391105652,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2750446391105652,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2800446391105652,
      -0.6450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2850446391105652,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.29504463911056517,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.30004463911056517,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3150446391105652,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3200446391105652,
      -0.6400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3300446391105652,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3350446391105652,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3400446391105652,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3450446391105652,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35004463911056516,
      -0.6350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35004463911056516,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35504463911056516,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.36004463911056517,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.36504463911056517,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3700446391105652,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3750446391105652,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3800446391105652,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3850446391105652,
      -0.6300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3950446391105652,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4000446391105652,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4050446391105652,
      -0.6250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4050446391105652,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.41504463911056516,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42004463911056517,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4300446391105652,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4350446391105652,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4400446391105652,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.6200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.6150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.6150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.6050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5850446391105651,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5750446391105651,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4650446391105652,
      -0.5000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.5000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.49004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.48504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.48004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.47504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.4050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.4000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.3850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.3800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.3700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.36004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.35004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.3400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.3300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.3250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.3200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.3150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.3050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.30004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.29504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.24504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.24004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.22004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.21004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.2000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.1950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.19004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.18504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.18004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.1750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.1700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.1650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.16004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.15504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.15004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      -0.1450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.1450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.1400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.1350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.13004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.10004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.09504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.09004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.08504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.08004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.07504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.07004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.06504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.060044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.05504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.050044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.045044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.04004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.035044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.030044639110565187,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.025044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.020044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      -0.015044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.015044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.010044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.0050446391105651855,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      -0.000044639110565185544,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.004955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.009955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.014955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.019955360889434816,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.024955360889434813,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.029955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.034955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.03995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.04495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.049955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.05995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.06995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.07495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.07995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.09995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.10495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.10995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.11495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.11995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.12495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.12995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4600446391105652,
      0.13495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      0.1399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      0.1449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      0.1499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      0.15495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      0.15995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      0.16495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      0.1699553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4550446391105652,
      0.1749553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      0.1799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      0.18495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      0.18995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4500446391105652,
      0.19495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      0.2049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      0.2099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      0.21495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4450446391105652,
      0.21995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4400446391105652,
      0.22495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4400446391105652,
      0.2299553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4400446391105652,
      0.2349553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4400446391105652,
      0.2399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4400446391105652,
      0.24495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4350446391105652,
      0.24995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4350446391105652,
      0.2549553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4350446391105652,
      0.25995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4350446391105652,
      0.26495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4350446391105652,
      0.26995536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4350446391105652,
      0.27495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4300446391105652,
      0.27495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4300446391105652,
      0.2799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4300446391105652,
      0.2849553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4300446391105652,
      0.2899553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4300446391105652,
      0.2949553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42504463911056517,
      0.2949553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42504463911056517,
      0.2999553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42504463911056517,
      0.3049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42504463911056517,
      0.3099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42504463911056517,
      0.3149553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42504463911056517,
      0.3199553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42004463911056517,
      0.32495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42004463911056517,
      0.32995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42004463911056517,
      0.33495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42004463911056517,
      0.3399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42004463911056517,
      0.3449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.42004463911056517,
      0.3399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.41504463911056516,
      0.3399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.41504463911056516,
      0.33495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.41504463911056516,
      0.32995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      0.32495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      0.3199553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      0.3149553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4050446391105652,
      0.3049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4050446391105652,
      0.2999553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4000446391105652,
      0.2899553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3950446391105652,
      0.2849553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3950446391105652,
      0.27495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      0.26495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3850446391105652,
      0.25995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3800446391105652,
      0.2399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3800446391105652,
      0.2349553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3800446391105652,
      0.2299553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3700446391105652,
      0.21995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3700446391105652,
      0.21495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.36504463911056517,
      0.21495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.36504463911056517,
      0.2099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.36504463911056517,
      0.2049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.36004463911056517,
      0.1999553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.36004463911056517,
      0.19495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.36004463911056517,
      0.18995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35504463911056516,
      0.18495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35504463911056516,
      0.1799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35504463911056516,
      0.1749553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35004463911056516,
      0.1749553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35004463911056516,
      0.1699553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35004463911056516,
      0.16495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3450446391105652,
      0.15995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3450446391105652,
      0.15495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3450446391105652,
      0.1499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3400446391105652,
      0.1499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3400446391105652,
      0.1449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3350446391105652,
      0.1399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3350446391105652,
      0.13495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3300446391105652,
      0.12995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3300446391105652,
      0.12495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3250446391105652,
      0.11995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3250446391105652,
      0.11495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3200446391105652,
      0.10995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3200446391105652,
      0.10495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3150446391105652,
      0.09995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3150446391105652,
      0.09495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      0.08995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      0.08495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      0.07995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3050446391105652,
      0.07495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3050446391105652,
      0.06995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.30004463911056517,
      0.06995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.30004463911056517,
      0.06495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.29504463911056517,
      0.05995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.29504463911056517,
      0.05495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.29004463911056516,
      0.05495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.29004463911056516,
      0.04495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.29004463911056516,
      0.03995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2850446391105652,
      0.03995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2850446391105652,
      0.034955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2850446391105652,
      0.029955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2800446391105652,
      0.029955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2800446391105652,
      0.024955360889434813,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2800446391105652,
      0.019955360889434816,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2750446391105652,
      0.019955360889434816,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2750446391105652,
      0.014955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2750446391105652,
      0.009955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2700446391105652,
      0.009955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2700446391105652,
      0.004955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2650446391105652,
      -0.000044639110565185544,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2650446391105652,
      -0.0050446391105651855,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2600446391105652,
      -0.010044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2600446391105652,
      -0.015044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2550446391105652,
      -0.015044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2550446391105652,
      -0.025044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2550446391105652,
      -0.030044639110565187,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2500446391105652,
      -0.030044639110565187,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2500446391105652,
      -0.035044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2500446391105652,
      -0.04004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.24504463911056518,
      -0.04004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.24504463911056518,
      -0.045044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.24004463911056517,
      -0.045044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.24004463911056517,
      -0.050044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.24004463911056517,
      -0.05504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2350446391105652,
      -0.05504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2350446391105652,
      -0.060044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2300446391105652,
      -0.060044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2300446391105652,
      -0.06504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2300446391105652,
      -0.07004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2300446391105652,
      -0.07004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2300446391105652,
      -0.07504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2250446391105652,
      -0.07504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2250446391105652,
      -0.08004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2250446391105652,
      -0.08504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.22004463911056518,
      -0.08504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.22004463911056518,
      -0.08504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.22004463911056518,
      -0.09004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.21504463911056518,
      -0.09004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.21504463911056518,
      -0.09504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.21004463911056517,
      -0.10004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.21004463911056517,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2050446391105652,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2050446391105652,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2000446391105652,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1950446391105652,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.19004463911056518,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.18004463911056517,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1700446391105652,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15504463911056518,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.13004463911056519,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.12004463911056519,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.10004463911056519,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.09004463911056519,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.08504463911056519,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07504463911056519,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.06504463911056518,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.060044639110565186,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.050044639110565184,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.045044639110565186,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.04004463911056519,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.04004463911056519,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.035044639110565184,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.030044639110565187,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.025044639110565186,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.020044639110565185,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.015044639110565186,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.010044639110565185,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.0050446391105651855,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.000044639110565185544,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.004955360889434815,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.009955360889434814,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.014955360889434815,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.019955360889434816,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.029955360889434814,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.034955360889434815,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.03995536088943481,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.04495536088943482,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.049955360889434815,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.05495536088943481,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.05995536088943482,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.05995536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.06495536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.06995536088943481,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.07495536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.07995536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.08495536088943481,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.08995536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.09495536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.09995536088943481,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10995536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11495536088943481,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11995536088943481,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.12495536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.12995536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.13495536088943483,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1449553608894348,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1499553608894348,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.15495536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.15995536088943482,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.16495536088943483,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1699553608894348,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1699553608894348,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1699553608894348,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1749553608894348,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1799553608894348,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.18495536088943482,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.18995536088943482,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.18995536088943482,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.19495536088943483,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1999553608894348,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2049553608894348,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2049553608894348,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21495536088943482,
      -0.11004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21995536088943482,
      -0.10504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21995536088943482,
      -0.10004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.22495536088943482,
      -0.10004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.22495536088943482,
      -0.09004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2299553608894348,
      -0.09004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2299553608894348,
      -0.08504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2349553608894348,
      -0.08004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.07504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.24995536088943482,
      -0.07004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2549553608894348,
      -0.06504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.25995536088943483,
      -0.060044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.25995536088943483,
      -0.05504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.26495536088943483,
      -0.050044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.26995536088943484,
      -0.050044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.26995536088943484,
      -0.045044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.26995536088943484,
      -0.04004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.27495536088943484,
      -0.04004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.27495536088943484,
      -0.030044639110565187,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2799553608894348,
      -0.030044639110565187,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2799553608894348,
      -0.025044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2849553608894348,
      -0.020044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2849553608894348,
      -0.015044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2899553608894348,
      -0.010044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2899553608894348,
      -0.0050446391105651855,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.000044639110565185544,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      0.004955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2999553608894348,
      0.004955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2999553608894348,
      0.009955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3049553608894348,
      0.014955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3049553608894348,
      0.019955360889434816,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3099553608894348,
      0.019955360889434816,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3099553608894348,
      0.024955360889434813,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3099553608894348,
      0.029955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3149553608894348,
      0.03995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3149553608894348,
      0.04495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3199553608894348,
      0.04495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3199553608894348,
      0.049955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3199553608894348,
      0.05495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32495536088943483,
      0.05495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32495536088943483,
      0.05995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32495536088943483,
      0.06495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      0.06495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      0.06995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      0.07495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      0.07495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      0.07995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      0.08495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      0.08995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3449553608894348,
      0.08995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3449553608894348,
      0.09495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3449553608894348,
      0.09995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      0.09995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      0.10495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      0.10995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3549553608894348,
      0.10995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3549553608894348,
      0.11495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3549553608894348,
      0.11995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3599553608894348,
      0.12495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3599553608894348,
      0.12995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3649553608894348,
      0.12995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3649553608894348,
      0.13495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3649553608894348,
      0.1399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3699553608894348,
      0.1399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3699553608894348,
      0.1449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3699553608894348,
      0.1499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      0.15495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      0.15995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      0.1799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      0.18495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39495536088943484,
      0.18495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39495536088943484,
      0.18995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39495536088943484,
      0.19495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      0.19495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      0.1999553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4049553608894348,
      0.2049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4049553608894348,
      0.2099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4099553608894348,
      0.2099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4099553608894348,
      0.21495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4099553608894348,
      0.21995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4149553608894348,
      0.21995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4149553608894348,
      0.22495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4149553608894348,
      0.2299553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4199553608894348,
      0.2299553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4199553608894348,
      0.2349553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4249553608894348,
      0.2399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4249553608894348,
      0.24495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4299553608894348,
      0.24495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4299553608894348,
      0.24995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4349553608894348,
      0.2549553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4349553608894348,
      0.25995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4399553608894348,
      0.25995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4399553608894348,
      0.26495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4449553608894348,
      0.26995536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4449553608894348,
      0.27495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.45495536088943483,
      0.27495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.45995536088943484,
      0.2799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.45995536088943484,
      0.2849553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4649553608894348,
      0.2849553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4649553608894348,
      0.2899553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4649553608894348,
      0.2949553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4699553608894348,
      0.2949553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4699553608894348,
      0.3049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4749553608894348,
      0.3049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4749553608894348,
      0.3099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4799553608894348,
      0.3099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4799553608894348,
      0.3149553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4849553608894348,
      0.3199553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4849553608894348,
      0.32495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4899553608894348,
      0.32495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4899553608894348,
      0.32995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4949553608894348,
      0.32995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4949553608894348,
      0.33495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      0.33495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      0.3399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      0.3399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      0.3399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.3449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.3449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.3499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.3549553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.3599553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.3599553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.3649553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5249553608894348,
      0.3649553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5249553608894348,
      0.3699553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.3699553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.3649553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.3649553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.3549553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5349553608894348,
      0.3199553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5349553608894348,
      0.3149553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5349553608894348,
      0.3049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2999553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2849553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.27495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.26995536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.26495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.25995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2549553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.24995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.24495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2349553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2299553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.22495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.21495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.1999553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.19495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.18995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.18495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.1799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.1749553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.1699553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.16495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.15995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.15495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5349553608894348,
      0.1499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5349553608894348,
      0.1449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5349553608894348,
      0.1399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5349553608894348,
      0.13495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.12995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.12495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.11995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.11495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5249553608894348,
      0.11495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5249553608894348,
      0.10995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5249553608894348,
      0.10495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5249553608894348,
      0.09995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.09995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.09495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.08995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.08495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.08495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.07995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.07495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.06995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.06995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.06495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.05995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.049955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.04495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.03995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.024955360889434813,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.019955360889434816,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      -0.015044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      -0.020044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      -0.025044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4949553608894348,
      -0.025044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4949553608894348,
      -0.020044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4949553608894348,
      -0.010044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      -0.0050446391105651855,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      0.004955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      0.009955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4999553608894348,
      0.019955360889434816,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.029955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.034955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.04495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.049955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.05995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.06495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.06995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.07995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.08495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.09495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.09995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.10995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.11495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.12495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.13495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.1399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.1449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.1499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.15495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.15995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.16495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.1699553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.1749553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.1799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.18495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.18995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.19495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.1999553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.2049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.2099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.2099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.21495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.21995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5099553608894348,
      0.22495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.22495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.2299553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.2349553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5149553608894348,
      0.2399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.2399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.24495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.24995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.2549553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.25995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.2799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.2849553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2899553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.2999553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.3049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.3049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.3049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.3099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.3149553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.3199553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.32495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.32995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5449553608894349,
      0.32995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5449553608894349,
      0.33495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5449553608894349,
      0.3399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5449553608894349,
      0.3449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5449553608894349,
      0.3499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5449553608894349,
      0.3549553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5449553608894349,
      0.3599553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5449553608894349,
      0.3649553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5499553608894349,
      0.3699553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5499553608894349,
      0.3749553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5499553608894349,
      0.3799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5499553608894349,
      0.38495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5499553608894349,
      0.38995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5549553608894349,
      0.38995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5549553608894349,
      0.39495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5549553608894349,
      0.39995536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5549553608894349,
      0.4049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5549553608894349,
      0.4099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.4099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.4149553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.4149553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.4099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.39995536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.39495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.38495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3749553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3649553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3599553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3549553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.33495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.32995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.32495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3199553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3149553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3099553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.3049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.2899553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.2849553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.2799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5599553608894348,
      0.27495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.27495536088943484,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.26495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.25995536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.2549553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.24995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.24495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.2399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.2299553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.22495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.21995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.21495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.2049553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.1999553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.19495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.18995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.18495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.1799553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.1749553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.1699553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.16495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.15995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.15495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.1499553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.1449553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.1399553608894348,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.13495536088943483,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.12995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.12495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.11995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.10995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.10495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.09995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.09495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.08995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.08495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.07995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.07495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.06995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.06495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.05995536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5749553608894348,
      0.05495536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5699553608894348,
      0.04495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.04495536088943482,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5649553608894348,
      0.03995536088943481,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5399553608894349,
      0.029955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5349553608894348,
      0.024955360889434813,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5299553608894348,
      0.024955360889434813,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5249553608894348,
      0.019955360889434816,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5199553608894348,
      0.014955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.5049553608894348,
      0.009955360889434814,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4949553608894348,
      0.004955360889434815,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4899553608894348,
      -0.000044639110565185544,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4799553608894348,
      -0.010044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4749553608894348,
      -0.020044639110565185,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4649553608894348,
      -0.030044639110565187,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.45995536088943484,
      -0.035044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.45495536088943483,
      -0.045044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.44995536088943483,
      -0.050044639110565184,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4449553608894348,
      -0.060044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4449553608894348,
      -0.07004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4299553608894348,
      -0.08504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4249553608894348,
      -0.09004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4199553608894348,
      -0.10004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.4099553608894348,
      -0.12004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39495536088943484,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      -0.1400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38495536088943483,
      -0.1450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3799553608894348,
      -0.15004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3799553608894348,
      -0.15504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      -0.15504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      -0.15004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3699553608894348,
      -0.1400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3699553608894348,
      -0.13004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3649553608894348,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3549553608894348,
      -0.10004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3549553608894348,
      -0.09004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.07004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.060044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.05504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.060044639110565186,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.07004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.09504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.13004463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.1650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      -0.21504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      -0.3050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      -0.3300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      -0.35004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      -0.3700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      -0.4050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      -0.3950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.3850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.3750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.3200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.3050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.29004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32995536088943483,
      -0.2650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      -0.2500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      -0.24504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      -0.2500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3399553608894348,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3449553608894348,
      -0.29504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3549553608894348,
      -0.3200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3599553608894348,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3649553608894348,
      -0.3750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3649553608894348,
      -0.4000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      -0.42504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3799553608894348,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3799553608894348,
      -0.4000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3799553608894348,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38495536088943483,
      -0.3700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38495536088943483,
      -0.35504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      -0.3150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.29004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.2300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.2050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.1950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.19004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.18504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.29504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.39995536088943484,
      -0.36004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      -0.42504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      -0.4450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38995536088943483,
      -0.4600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.38495536088943483,
      -0.4650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3799553608894348,
      -0.4550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3799553608894348,
      -0.4350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3749553608894348,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3649553608894348,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3599553608894348,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3499553608894348,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3449553608894348,
      -0.30004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.33495536088943484,
      -0.2650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.32495536088943483,
      -0.2350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3199553608894348,
      -0.2000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3099553608894348,
      -0.1750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3049553608894348,
      -0.16004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.3049553608894348,
      -0.1450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2999553608894348,
      -0.1400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.1400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.15504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.18004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.2050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.24504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.3250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2949553608894348,
      -0.42504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2899553608894348,
      -0.4350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2899553608894348,
      -0.4300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2849553608894348,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2849553608894348,
      -0.4000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2799553608894348,
      -0.3800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.26995536088943484,
      -0.3400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.26995536088943484,
      -0.3100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.26495536088943483,
      -0.30004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2549553608894348,
      -0.21004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2549553608894348,
      -0.21504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2549553608894348,
      -0.22004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2549553608894348,
      -0.2300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.24495536088943481,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.24495536088943481,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.24495536088943481,
      -0.3100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.24495536088943481,
      -0.3400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.24495536088943481,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.24495536088943481,
      -0.3800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.3950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.4050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.4050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2349553608894348,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2299553608894348,
      -0.3800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2299553608894348,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21495536088943482,
      -0.3400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2099553608894348,
      -0.30004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1999553608894348,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.18495536088943482,
      -0.2350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1799553608894348,
      -0.21504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1799553608894348,
      -0.2050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1749553608894348,
      -0.2000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1749553608894348,
      -0.2050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1749553608894348,
      -0.2350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1749553608894348,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.16495536088943483,
      -0.29504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.16495536088943483,
      -0.3250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.15995536088943482,
      -0.36004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.15995536088943482,
      -0.3850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1499553608894348,
      -0.4000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1449553608894348,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1449553608894348,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.13495536088943483,
      -0.2500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.21004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.18504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.1650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1449553608894348,
      -0.15504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1449553608894348,
      -0.16004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1449553608894348,
      -0.18504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1449553608894348,
      -0.22004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.3050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.12995536088943482,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11995536088943481,
      -0.4050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11495536088943481,
      -0.4450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11495536088943481,
      -0.4700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.49004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.5000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.5050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.5000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.49004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.47504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.4500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.42504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.3950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11495536088943481,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11495536088943481,
      -0.3100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11495536088943481,
      -0.29004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11995536088943481,
      -0.2750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.12495536088943482,
      -0.2650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.12495536088943482,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.12995536088943482,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1399553608894348,
      -0.2650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1499553608894348,
      -0.29004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.16495536088943483,
      -0.3200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1799553608894348,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.18495536088943482,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2049553608894348,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21495536088943482,
      -0.42504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21995536088943482,
      -0.4350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21995536088943482,
      -0.4600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21995536088943482,
      -0.4550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.22495536088943482,
      -0.4450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.22495536088943482,
      -0.4300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.22495536088943482,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.22495536088943482,
      -0.4050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2299553608894348,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2349553608894348,
      -0.3700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2349553608894348,
      -0.35004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.3400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.3850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2399553608894348,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2349553608894348,
      -0.4400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2349553608894348,
      -0.4650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21995536088943482,
      -0.48504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.21495536088943482,
      -0.5000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2099553608894348,
      -0.5100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1999553608894348,
      -0.5150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.19495536088943483,
      -0.5150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.18995536088943482,
      -0.5150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1799553608894348,
      -0.5100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.16495536088943483,
      -0.4950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.15495536088943482,
      -0.48004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.1499553608894348,
      -0.4550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.13495536088943483,
      -0.4300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.12995536088943482,
      -0.4050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.11495536088943481,
      -0.3750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.10495536088943482,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.09995536088943481,
      -0.3200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.09495536088943482,
      -0.3050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.08495536088943481,
      -0.29004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.07995536088943482,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.07495536088943482,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.06995536088943481,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.06995536088943481,
      -0.2850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.049955360889434815,
      -0.42504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.049955360889434815,
      -0.4350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.049955360889434815,
      -0.4400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.04495536088943482,
      -0.4350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.03995536088943481,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.03995536088943481,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.034955360889434815,
      -0.3850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.034955360889434815,
      -0.36004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.3300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.29504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.24504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.2300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.22004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.21504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.22004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.2300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.29004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.024955360889434813,
      -0.3300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.019955360889434816,
      -0.3750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.009955360889434814,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.000044639110565185544,
      -0.4450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.015044639110565186,
      -0.4700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.020044639110565185,
      -0.4950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.025044639110565186,
      -0.5050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.04004463911056519,
      -0.5200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.045044639110565186,
      -0.5150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.050044639110565184,
      -0.5050446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.050044639110565184,
      -0.49004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.05504463911056519,
      -0.4650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.05504463911056519,
      -0.4500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.06504463911056518,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.06504463911056518,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07004463911056519,
      -0.3750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07004463911056519,
      -0.35504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07504463911056519,
      -0.3200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.08004463911056518,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.08004463911056518,
      -0.35504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.09004463911056519,
      -0.3800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.10504463911056519,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.4350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.12004463911056519,
      -0.4550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.12504463911056518,
      -0.47504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.13004463911056519,
      -0.49004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.13004463911056519,
      -0.4950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1350446391105652,
      -0.5000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1350446391105652,
      -0.4950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1350446391105652,
      -0.47504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1350446391105652,
      -0.4600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.4350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.4100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.3850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.35004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.3100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.2850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.2650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.2500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.24004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.2350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.24004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.2500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.30004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.3250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.36004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15004463911056518,
      -0.4000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15004463911056518,
      -0.42504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15504463911056518,
      -0.4400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15504463911056518,
      -0.4500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15504463911056518,
      -0.4550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15504463911056518,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15004463911056518,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1450446391105652,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1350446391105652,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.13004463911056519,
      -0.3100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.12504463911056518,
      -0.2850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11504463911056519,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.30004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.3150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.3400446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.35504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.3700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.3750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.3800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.3750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.11004463911056518,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.10504463911056519,
      -0.3200446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.10004463911056519,
      -0.29004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.10004463911056519,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.09004463911056519,
      -0.2250446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07504463911056519,
      -0.19004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07504463911056519,
      -0.1700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07004463911056519,
      -0.16004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07004463911056519,
      -0.15504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07004463911056519,
      -0.15004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07004463911056519,
      -0.15504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07004463911056519,
      -0.1650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.07004463911056519,
      -0.18004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.12504463911056518,
      -0.4000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.12504463911056518,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.13004463911056519,
      -0.4450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1400446391105652,
      -0.4600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1450446391105652,
      -0.47504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15004463911056518,
      -0.48504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15504463911056518,
      -0.48504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.15504463911056518,
      -0.48004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.16004463911056518,
      -0.47504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1700446391105652,
      -0.4500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1750446391105652,
      -0.42504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.19004463911056518,
      -0.4000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.1950446391105652,
      -0.36504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.21504463911056518,
      -0.3350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.22004463911056518,
      -0.30004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2350446391105652,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2500446391105652,
      -0.2500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2550446391105652,
      -0.2300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2700446391105652,
      -0.22004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2750446391105652,
      -0.21004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2800446391105652,
      -0.21004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2850446391105652,
      -0.21004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2850446391105652,
      -0.21504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.2850446391105652,
      -0.2350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.29004463911056516,
      -0.2600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.29004463911056516,
      -0.29504463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.29004463911056516,
      -0.3300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.30004463911056517,
      -0.3700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.30004463911056517,
      -0.3950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.30004463911056517,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3050446391105652,
      -0.4500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3050446391105652,
      -0.4600446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3050446391105652,
      -0.4700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.4700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.41504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.3800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.3450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.3100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.2850446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3100446391105652,
      -0.2500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3150446391105652,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3150446391105652,
      -0.2800446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3250446391105652,
      -0.3150446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3300446391105652,
      -0.35004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3450446391105652,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.35504463911056516,
      -0.4300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.36504463911056517,
      -0.4500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3700446391105652,
      -0.47504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3850446391105652,
      -0.49004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.5000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.4950446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.48004463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.4650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.4500446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.42004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.3900446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.35504463911056516,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.3100446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.2750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.24504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3850446391105652,
      -0.21004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3850446391105652,
      -0.19004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3850446391105652,
      -0.1750446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3850446391105652,
      -0.18004463911056517,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3850446391105652,
      -0.19004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3900446391105652,
      -0.2350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3950446391105652,
      -0.24504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3950446391105652,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.3950446391105652,
      -0.2650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4000446391105652,
      -0.2700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4000446391105652,
      -0.2650446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4000446391105652,
      -0.2550446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4000446391105652,
      -0.24504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4000446391105652,
      -0.2300446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.22004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.2000446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.19004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.1700446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.16004463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.1450446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.1350446391105652,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.12504463911056518,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.4100446391105652,
      -0.11504463911056519,
      0
    ],
    "color": [
      0.32,
      0.21,
      0.14,
      1
    ],
    "size": "40",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      -0.2099553608894348,
      -0.1400446391105652,
      0
    ],
    "color": [
      0,
      0,
      0,
      1
    ],
    "size": "23",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.24004463911056517,
      -0.08004463911056518,
      0
    ],
    "color": [
      0,
      0,
      0,
      1
    ],
    "size": "23",
    "segments": null
  },
  {
    "type": "triangle",
    "position": [
      0.035044639110565184,
      -0.2800446391105652,
      0
    ],
    "color": [
      0,
      0,
      0,
      1
    ],
    "size": "23",
    "segments": null
  }
]