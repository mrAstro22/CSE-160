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
let g_globalAngleX = -6;
let g_globalAngleY = 20;
let g_mouseDown = false;
let g_lastX = 0;
let g_lastY = 0;

let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_tongueAngle = 0;

// Animations
let g_yellowAnimation = false;
let g_tongueAnimation = false;


function UIElements(){
  // Color Slider Events
  document.getElementById('yellowSlide').addEventListener('mousemove', function() {g_yellowAngle = this.value; renderShapes(); })
  document.getElementById('magentaSlide').addEventListener('mousemove', function() {g_magentaAngle = this.value; renderShapes(); })
  document.getElementById('tongueSlide').addEventListener('mousemove', function() {g_tongueAngle = this.value; renderShapes(); })


  // // Animation
  // document.getElementById('yellowOn').onclick = function(){g_yellowAnimation=true}
  // document.getElementById('yellowOff').onclick = function(){g_yellowAnimation=false}


  // Mouse rotation controls and Shift Click Logic
  canvas.onmousedown = function(ev) {
    g_mouseDown = true;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
    if (ev.shiftKey) {
      g_yellowAnimation = true;
      g_tongueAnimation = true;
    }
  };

  canvas.onmouseup = function() {
    g_mouseDown = false;
    g_yellowAnimation = false;    // turn off when released
    g_tongueAnimation = false;
  };

  canvas.onmousemove = function(ev) {
    if (!g_mouseDown) return;

    let dx = ev.clientX - g_lastX;
    let dy = ev.clientY - g_lastY;

    g_globalAngleY += dx * 0.5;  // horizontal drag = spin
    g_globalAngleX += dy * 0.5;  // vertical drag = tilt

    // Prevent flipping upside-down
    g_globalAngleX = Math.max(-90, Math.min(90, g_globalAngleX));

    g_lastX = ev.clientX;
    g_lastY = ev.clientY;

    renderShapes(); // immediate feedback
  };
}

function main() {

  // Setup canvas and gl Variables
  setupWebGL();

  // Setup GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Clicking Events for Buttong
  UIElements();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.133, 0.545, 0.133, 1.0);

  // renderShapes();
  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0-g_startTime;
  // console.log(performance.now());

  updateAnimationAngles();

  // Draw Everything
  renderShapes();

  // Tell browser to update again when it has time
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    // if(g_yellowAnimation) {
    //   g_yellowAngle = 45*Math.sin(g_seconds);
    // }
    if(g_tongueAnimation) {
      g_tongueAngle = 30*Math.sin(30 * g_seconds);
    }
    // if(g_magentaAnimation) {
    //   g_magentaAngle = (45*Math.sin(3 * g_seconds));
    // }
}

function renderShapes(){

  // Check the time at the start of this function
  // var startTime = performance.now();
  var globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0); // tilt
  globalRotMat.rotate(g_globalAngleY, 0, 1, 0); // spin

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // head.color = [0.7, 0.6, 0.5, 1.0];  // sloth head color

  // Draw Head
  var head = new Sphere();
  head.matrix = new Matrix4();        // identity
  head.color = [0.35, 0.3, 0.25, 1.0];  // sloth head color
  head.matrix.translate(0, 0, 0.35);
  head.matrix.scale(0.25, 0.22, 0.25);
  head.render();

  // Draw Face
  var faceMat = new Matrix4(head.matrix); // Copy of Head
  var face = new Sphere();
  face.matrix = faceMat;
  face.color = [0.7, 0.6, 0.5, 1.0]; // darker brown for the face
  face.matrix.translate(0, 0, -0.45); // slightly in front of the head
  face.matrix.scale(0.8, 0.7, 0.6);       // smaller and flatter than the head
  face.render();

  var eye1 = new Sphere();
  eye1.matrix = new Matrix4(faceMat);
  eye1.color = [0, 0, 0, 1];
  eye1.matrix.translate(-0.5, 0.3, -0.8);
  eye1.matrix.scale(0.1, 0.1, 0.1);       // smaller and flatter than the head
  eye1.render();

  var eye2 = new Sphere();
  eye2.matrix = new Matrix4(faceMat);
  eye2.color = [0, 0, 0, 1];
  eye2.matrix.translate(0.5, 0.3, -0.8);
  eye2.matrix.scale(0.1, .1, .1);  
  eye2.render();

  var nose = new Sphere();
  nose.matrix = new Matrix4(faceMat);
  nose.color = [0, 0, 0, 1];
  nose.matrix.translate(0, 0.1, -0.9);
  nose.matrix.scale(0.2, .2, .2);  
  nose.render();

  var mouth = new Sphere();
  mouth.matrix = new Matrix4(faceMat);
  mouth.color = [0, 0, 0, 1];
  mouth.matrix.translate(0, -0.4, -0.9);
  mouth.matrix.scale(0.3, .1, .1); 
  mouth.render();

  if(g_tongueAnimation) {
    var tongue = new Sphere();
    tongue.matrix = new Matrix4(faceMat);
    tongue.color = [1.0, 0.3, 0.4, 1.0];
    tongue.matrix.translate(0, -0.35, -0.85);
    tongue.matrix.rotate(-35, 1, 0, 0);
    tongue.matrix.rotate(g_tongueAngle, 0, 1, 0);
    tongue.matrix.scale(0.2, 0.05, .5);
    tongue.render();
  }

  // Draw Body
  var body = new Sphere();
  body.matrix = new Matrix4();  
  body.color = [0.35, 0.3, 0.25, 1.0];
  body.matrix.rotate(15, 1, 0, 0);
  body.matrix.translate(0, 0.08, 0.7);
  body.matrix.scale(0.25, 0.20, 0.5);
  body.render();

  // // Draw a left arm
  // var leftArm = new Cube();
  // leftArm.color = [1, 1, 0, 1];
  // leftArm.matrix.setTranslate(0, -.5, 0.0);
  // leftArm.matrix.rotate(-g_yellowAngle, -0,0,1);
  // // leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  // // if(g_yellowAnimation) {
  // //     leftArm.matrix.rotate(45*Math.sin(g_seconds), 0, 0, 1);
  // // } else{
  // //     leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  // // }
  // var yellowCoordinatesMat = new Matrix4(leftArm.matrix); // Copy of arm
  // leftArm.matrix.scale(0.25, .7, 0.5);
  // leftArm.matrix.translate(-0.5, 0, 0);
  // leftArm.render();

  // // Test Box
  // var box = new Cube;
  // box.color = [1,0,1,1];
  // box.matrix = yellowCoordinatesMat;
  // box.matrix.translate(0, .7, 0);
  // box.matrix.rotate(-g_magentaAngle, 0, 0, 1);
  // box.matrix.scale(.3, .3, .3);
  // box.matrix.translate(-.5, 0, -.0001);
  // box.render();

  // Check the time at the end of the function
  // var duration = performance.now() - startTime;
  // sendTextToHtml(" as ")
}
