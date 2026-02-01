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
let g_globalAngleX = -5;
let g_globalAngleY = 50;
let g_mouseDown = false;
let g_lastX = 0;
let g_lastY = 0;

let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_tongueAngle = 0;

let g_leftArmAngle = 225;
let g_leftElbowAngle = 45;

let g_rightArmAngle = 225;
let g_rightElbowAngle = 45;

let g_leftLegAngle = 250;
let g_rightLegAngle = 250;

let g_leftFootAngle = 45;
let g_rightFootAngle = 45;

let g_bodyAngle = 15;

// Animations
let g_standAnimation = false;
let g_tongueAnimation = false;


function UIElements(){
  // Color Slider Events
  document.getElementById('leftArmSlide').addEventListener('mousemove', function() {g_leftArmAngle = this.value; renderShapes(); })
  document.getElementById('leftElbowSlide').addEventListener('mousemove', function() {g_leftElbowAngle = this.value; renderShapes(); })

  document.getElementById('rightArmSlide').addEventListener('mousemove', function() {g_rightArmAngle = this.value; renderShapes(); })
  document.getElementById('rightElbowSlide').addEventListener('mousemove', function() {g_rightElbowAngle = this.value; renderShapes(); })
  
  document.getElementById('leftLegSlide').addEventListener('mousemove', function() {g_leftLegAngle = this.value; renderShapes(); })
  document.getElementById('rightLegSlide').addEventListener('mousemove', function() {g_rightLegAngle = this.value; renderShapes(); })

  document.getElementById('leftFootSlide').addEventListener('mousemove', function() {g_leftFootAngle = this.value; renderShapes(); })
  document.getElementById('rightFootSlide').addEventListener('mousemove', function() {g_rightFootAngle = this.value; renderShapes(); })

  document.getElementById('bodySlide').addEventListener('mousemove', function() {g_bodyAngle = this.value; renderShapes(); })
  // document.getElementById('tongueSlide').addEventListener('mousemove', function() {g_tongueAngle = this.value; renderShapes(); })


  // // Animation
  document.getElementById('yellowOn').onclick = function(){g_tongueAnimation=true}
  document.getElementById('yellowOff').onclick = function(){g_tongueAnimation=false}


  // Mouse rotation controls and Shift Click Logic
  canvas.onmousedown = function(ev) {
    g_mouseDown = true;
    g_lastX = ev.clientX;
    g_lastY = ev.clientY;
    if (ev.shiftKey) {
      g_standAnimation = true;
      g_tongueAnimation = true;
    }
  };

  canvas.onmouseup = function() {
    g_mouseDown = false;
    g_standAnimation = false;    // turn off when released
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
    if(g_standAnimation) {
      let raw = Math.sin(g_seconds);   // -1 to 1
      let minAngle = 15;
      let maxAngle = 30;

      g_bodyAngle = minAngle + (raw + 1) * (maxAngle - minAngle) / 2
    }

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
  head.matrix = new Matrix4();
  head.matrix.translate(0, 0, 0.35);

  // Save joint space BEFORE scale
  var headJoint = new Matrix4(head.matrix);

  // HEAD SHAPE
  head.color = [0.35, 0.3, 0.25, 1.0];
  head.matrix.scale(0.25, 0.22, 0.25);
  head.render();

  // Draw Face
  var face = new Sphere();
  face.matrix = new Matrix4(headJoint);  // attach to head JOINT
  face.color = [0.7, 0.6, 0.5, 1.0];

  face.matrix.translate(0, 0, -0.095);

  var faceJoint = new Matrix4(face.matrix);

  face.matrix.scale(0.2, 0.16, 0.18);
  face.render();


  var eye1 = new Sphere();
  eye1.matrix = new Matrix4(faceJoint);
  eye1.color = [0,0,0,1];
  eye1.matrix.translate(-0.07, 0.05, -0.125);
  eye1.matrix.scale(0.03,0.03,0.03);
  eye1.render();

  var eye2 = new Sphere();
  eye2.matrix = new Matrix4(faceJoint);
  eye2.color = [0,0,0,1];
  eye2.matrix.translate(0.07, 0.05, -0.125);
  eye2.matrix.scale(0.03,0.03,0.03);
  eye2.render();


  var nose = new Sphere();
  nose.matrix = new Matrix4(faceJoint);
  nose.color = [0,0,0,1];
  nose.matrix.translate(0, 0.0, -0.15);
  nose.matrix.scale(0.04,0.04,0.04);
  nose.render();


  var mouth = new Sphere();
  mouth.matrix = new Matrix4(faceJoint);
  mouth.color = [0,0,0,1];
  mouth.matrix.translate(0, -0.06, -0.15);
  mouth.matrix.scale(0.08,0.02,0.02);
  mouth.render();


  if (g_tongueAnimation) {
    var tongue = new Sphere();
    tongue.matrix = new Matrix4(faceJoint);
    tongue.color = [1.0, 0.3, 0.4, 1.0];

    // joint position
    tongue.matrix.translate(0, -0.04, -0.12);

    // point downward first
    tongue.matrix.rotate(-40, 1, 0, 0);

    // sway left-right
    tongue.matrix.rotate(g_tongueAngle, 0, 1, 0);

    tongue.matrix.scale(0.05, 0.01, 0.12);
    tongue.render();
  }


  // Draw Body
  var body = new Sphere();
  body.color = [0.35, 0.3, 0.25, 1.0];
  body.matrix.rotate(g_bodyAngle, 1, 0, 0);
  if (g_standAnimation) {
    body.matrix.rotate(g_bodyAngle, 1, 0, 0);
  }
  body.matrix.translate(0, 0.08, 0.7);
  var bodyMat = new Matrix4(body.matrix);  
  body.matrix.scale(0.25, 0.20, 0.5);
  body.render();


  // Draw a right arm
  var rightArm = new Cube();
  rightArm.matrix = new Matrix4(bodyMat);

  rightArm.color = [0.35, 0.3, 0.25, 1.0];
  rightArm.matrix.translate(-.16, 0.04, -.18);
  rightArm.matrix.rotate(-g_rightArmAngle, 1,0,0);

  var rightArmMat = new Matrix4(rightArm.matrix);  
  rightArm.matrix.scale(0.15, .15, 0.5);

  rightArm.matrix.translate(-0.5, 0, 0);
  rightArm.render();

  // Right Elbow
  var rightElbow = new Cube();
  rightElbow.matrix = new Matrix4(rightArmMat);
  rightElbow.color = [0.35, 0.3, 0.25, 1.0];
  rightElbow.matrix.translate(-0.075, 0.09, 0.45);
  rightElbow.matrix.rotate(g_rightElbowAngle,1,0,0);

  rightElbow.matrix.scale(0.15, .15, 0.4);  
  rightElbow.matrix.translate(0, -0.5, 0);
  rightElbow.render();

  // Draw a left arm
  var leftArm = new Cube();
  leftArm.matrix = new Matrix4(bodyMat);

  leftArm.color = [0.35, 0.3, 0.25, 1.0];
  leftArm.matrix.translate(.16, 0, -.18);
  leftArm.matrix.rotate(-g_leftArmAngle, 1, 0,0);

  var leftArmMat = new Matrix4(leftArm.matrix);  

  leftArm.matrix.scale(0.15, .15, 0.4);
  leftArm.matrix.translate(-0.5, 0, 0);
  leftArm.render();

  // Left Elbow
  var leftElbow = new Cube();
  leftElbow.matrix = new Matrix4(leftArmMat);
  leftElbow.color = [0.35, 0.3, 0.25, 1.0];
  leftElbow.matrix.translate(-0.075, 0.1, 0.35);

  leftElbow.matrix.rotate(g_leftElbowAngle,1,0,0);

  leftElbow.matrix.scale(0.15, .15, 0.4);  
  leftElbow.matrix.translate(0, -0.5, 0);
  leftElbow.render();

  // Right Leg
  var rightLeg = new Cube();
  rightLeg.matrix = new Matrix4(bodyMat);  

  rightLeg.color = [0.32, 0.28, 0.24, 1.0];

  // Translate to hip position relative to the body
  rightLeg.matrix.translate(-0.17, 0, 0.2);  // tweak these numbers to fit your model

  // Rotate at the hip if needed (for animation)
  rightLeg.matrix.rotate(-g_rightLegAngle, 1, 0, 0);  // optional rotation

  // Save the joint matrix for knee/foot
  var rightLegJoint = new Matrix4(rightLeg.matrix);

  // Scale the leg shape
  rightLeg.matrix.scale(0.15, .15, 0.4);

  rightLeg.render();

  // Right Foot
  var rightFoot = new Cube();
  rightFoot.matrix = new Matrix4(rightLegJoint);  // start at the knee/hip joint
  rightFoot.color = [0.32, 0.28, 0.24, 1.0];      // slightly darker brown for the foot

  // Translate to ankle/foot position relative to the leg
  rightFoot.matrix.translate(0, 0.1, 0.3);  // move forward along Z, tweak if needed

  // Optional: rotate foot slightly
  rightFoot.matrix.rotate(g_rightFootAngle, 1, 0, 0);   // tilt foot forward slightly

  // Scale the foot shape
  rightFoot.matrix.scale(0.15, 0.15, 0.25);  // make it shorter and flatter than the leg

  rightFoot.render();

  // Left Leg
  var leftLeg = new Cube();
  leftLeg.matrix = new Matrix4(bodyMat);  

  leftLeg.color = [0.32, 0.28, 0.24, 1.0];

  // Translate to hip position relative to the body
  leftLeg.matrix.translate(0.06, 0, 0.2);  // tweak these numbers to fit your model

  // Rotate at the hip if needed (for animation)
  leftLeg.matrix.rotate(-g_leftLegAngle, 1, 0, 0);  // optional rotation

  // Save the joint matrix for knee/foot
  var leftLegJoint = new Matrix4(leftLeg.matrix);

  // Scale the leg shape
  leftLeg.matrix.scale(0.15, .15, 0.4);

  leftLeg.render();

  // Left Foot
  var leftFoot = new Cube();
  leftFoot.matrix = new Matrix4(leftLegJoint);  // start at the knee/hip joint
  leftFoot.color = [0.32, 0.28, 0.24, 1.0];      // slightly darker brown for the foot

  // Translate to ankle/foot position relative to the leg
  leftFoot.matrix.translate(0, 0.1, 0.3);  // move forward along Z, tweak if needed

  // Optional: rotate foot slightly
  leftFoot.matrix.rotate(g_leftFootAngle, 1, 0, 0);   // tilt foot forward slightly

  // Scale the foot shape
  leftFoot.matrix.scale(0.15, 0.15, 0.25);  // make it shorter and flatter than the leg

  leftFoot.render();

  // Check the time at the end of the function
  // var duration = performance.now() - startTime;
  // sendTextToHtml(" as ")
}
