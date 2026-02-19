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
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform int u_whichTexture;
  void main() {
    if(u_whichTexture == -2) {    
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else {
      gl_FragColor = vec4(1,.2, .2, 1);
    }
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
let u_Sampler0;
let u_whichTexture;

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
  
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }


  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// Global UI Elements
let g_globalAngle = 0;
let g_selectedColor= [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_selectedType = "square";
let g_yellowAngle = 0;
let g_magentaAngle = 0;

function UIElements(){
  // Button Events
  document.getElementById('green').onclick = function(){g_selectedColor = [0.0,1.0,0.0,1.0]; }
  document.getElementById('red').onclick = function(){g_selectedColor = [1.0,0.0,0.0,1.0]; }


  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; })
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; })
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; })

  // Shapes
  document.getElementById('triangles').onclick = function(){g_selectedType = "triangle" }
  document.getElementById('squares').onclick = function(){g_selectedType = "square" }
  document.getElementById('circles').onclick = function(){g_selectedType = "circle" }
  renderShapes();
}

function initTextures(gl, n) {

  var image = new Image();
  if(!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event hander to be called on loading an image
  image.onload = function(){sendTextureToTEXTURE0(image);}

  // Tell the browser to load an image
  image.src = 'sky.jpg';

  // Add more texture loading
  return true;
}

function sendTextureToTEXTURE0(image) {
  var texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);

  // gl.clear(gl.COLOR_BUFFER_BIT);
  console.log('finished loadTexture');
}

function main() {

  // Setup canvas and gl Variables
  setupWebGL();

  // Setup GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Clicking Events for Buttong
  UIElements();

  initTextures(gl, 0);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  requestAnimationFrame(tick);
}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

function tick(){
  g_seconds = performance.now()/1000.0 - g_startTime;
  renderShapes();
  requestAnimationFrame(tick);
}

function renderShapes(){

  // var startTime = performance.now();

  // Pass the projection matrix
  var projMatrix = new Matrix4();
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);

  // Pass the view matrix
  var viewMat = new Matrix4();
  viewMat.setLookAt(0,0,-1, 0,0,0, 0,1,0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // Pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Render each shape in the list
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.textureNum = 0;
  body.matrix.translate(-.25, -.75, 0.0);
  body.matrix.rotate(-5,1,0,0);
  body.matrix.scale(0.5, 0.3, 0.5);
  body.render();

  // Yellow Arm
  var yellow = new Cube();
  yellow.color = [1.0, 1.0, 0.0, 1.0];
  yellow.matrix.setTranslate(0, -0.5, 0.0);
  yellow.matrix.rotate(-5, 1, 0, 0);
  yellow.matrix.rotate(-g_yellowAngle, 0, 0, 1);
  var yellowCoordinatesMat = new Matrix4(yellow.matrix);
  yellow.matrix.scale(0.25, 0.7, 0.5);
  yellow.matrix.translate(-0.5, 0, 0);
  yellow.render();

  // Magenta Box
  var magenta = new Cube();
  magenta.color = [1.0, 0.0, 1.0, 1.0];
  magenta.textureNum = 0;
  magenta.matrix = yellowCoordinatesMat;
  magenta.matrix.translate(0, 0.65, 0);
  magenta.matrix.rotate(g_magentaAngle, 0, 0, 1);
  magenta.matrix.scale(0.3, 0.3, 0.3);
  magenta.matrix.translate(-0.5, 0, -0.001);
  magenta.render();

  // Ground Plane
  var ground = new Cube();
  ground.matrix.translate(0, 0, -1);
  ground.matrix.scale(2, 0.1, 2);
  ground.render();
}

// function logShapes() {
//   const simplified = g_shapesList.map(shape => ({
//     type: shape.type,
//     position: shape.position,
//     color: shape.color,
//     size: shape.size,
//     segments: shape.segments || null
//   }));
  
//   console.log(JSON.stringify(simplified, null, 2));
// }
