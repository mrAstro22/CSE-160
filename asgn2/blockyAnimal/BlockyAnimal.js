// BlockyAnimal.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`


// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
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

  // Set an initial value for this matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  initCubeBuffer(gl);
}

// Constants
// const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global UI Elements
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;

function UIElements(){
  // Button Events
  // document.getElementById('green').onclick = function(){g_selectedColor = [0.0,1.0,0.0,1.0]; }
  // document.getElementById('red').onclick = function(){g_selectedColor = [1.0,0.0,0.0,1.0]; }
  // document.getElementById('clear').onclick = function(){g_shapedList = []; renderShapes(); }

  // document.getElementById('squares').onclick = function(){g_selectedType = POINT;}
  // document.getElementById('triangles').onclick = function(){g_selectedType = TRIANGLE; }
  // document.getElementById('circles').onclick = function(){g_selectedType = CIRCLE; }

  // Color Slider Events
  document.getElementById('yellowSlide').addEventListener('mousemove', function() {g_yellowAngle = this.value; renderShapes(); })
  document.getElementById('magentaSlide').addEventListener('mousemove', function() {g_magentaAngle = this.value; renderShapes(); })

  // Animation
  document.getElementById('yellowOn').onclick = function(){g_yellowAnimation=true}
  document.getElementById('yellowOff').onclick = function(){g_yellowAnimation=false}

  // Angle
  document.getElementById('angleSlide').addEventListener('mousemove', function() {g_globalAngle = this.value; renderShapes(); })
}

function main() {

  // Setup canvas and gl Variables
  setupWebGL();

  // Setup GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Clicking Events for Buttong
  UIElements();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // renderShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0-g_startTime;
  console.log(performance.now());

  updateAnimationAngles();

  // Draw Everything
  renderShapes();

  // Tell browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    if(g_yellowAnimation) {
      g_yellowAngle = 45*Math.sin(g_seconds);
    }
    // if(g_magentaAnimation) {
    //   g_magentaAngle = (45*Math.sin(3 * g_seconds));
    // }
}

function renderShapes(){

  // Check the time at the start of this function
  // var startTime = performance.now();
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw a test Triangle
  // drawTriangle3D([-1.0, 0.0, 0.0,  -0.5, -1.0, 0.0,  0.0, 0.0, 0.0]);

  // Draw Cube
  var body = new Cube();
  body.color = [1, 0, 0, 1];
  body.matrix.translate(-.25, -.75, 0.0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(0.5, .3, 0.5);
  body.render();

  // Draw a left arm
  var leftArm = new Cube();
  leftArm.color = [1, 1, 0, 1];
  leftArm.matrix.setTranslate(0, -.5, 0.0);
  // leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  if(g_yellowAnimation) {
      leftArm.matrix.rotate(45*Math.sin(g_seconds), 0, 0, 1);
  } else{
      leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  }
  var yellowCoordinatesMat = new Matrix4(leftArm.matrix); // Copy of arm
  leftArm.matrix.scale(0.25, .7, 0.5);
  leftArm.matrix.translate(-0.5, 0, 0);
  leftArm.render();

  // Test Box
  var box = new Cube;
  box.color = [1,0,1,1];
  box.matrix = yellowCoordinatesMat;
  box.matrix.translate(0, .7, 0);
  box.matrix.rotate(-g_magentaAngle, 0, 0, 1);
  box.matrix.scale(.3, .3, .3);
  box.matrix.translate(-.5, 0, -.0001);
  box.render();

  // Check the time at the end of the function
  // var duration = performance.now() - startTime;
  // sendTextToHtml(" as ")
}
