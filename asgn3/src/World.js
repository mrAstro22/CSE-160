// World.js (c) 2012 matsuda
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
    v_UV = vec2(1.0 - a_UV.y, a_UV.x);
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4, u_Sampler5;
  uniform int u_whichTexture;
  void main() {
    if(u_whichTexture == -2) {    
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV) * u_FragColor;
    } else if (u_whichTexture == 4) {
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    } else if (u_whichTexture == 5) {
      gl_FragColor = texture2D(u_Sampler5, v_UV);
    }
  }`


// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4, u_Sampler5;
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

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler2');
    return;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if (!u_Sampler3) {
    console.log('Failed to get the storage location of u_Sampler3');
    return;
  }
  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  if (!u_Sampler4) {
    console.log('Failed to get the storage location of u_Sampler4');
    return;
  }
  u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
  if (!u_Sampler5) {
    console.log('Failed to get the storage location of u_Sampler5');
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
let g_mouseDown = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

// Animal Animation
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
let g_cameraKeyboardAngle = 0;
// Camera
let g_camera = new Camera();

function UIElements(){
  window.addEventListener('keydown', (e) => {
    const step = 5; // degrees per press
    if (e.key === 'q' || e.key === 'Q') {
      g_globalAngle += step;  // rotate left
    } else if (e.key === 'e' || e.key === 'E') {
      g_globalAngle -= step;  // rotate right
    }

    // Optional: keep angle between 0-360
    g_globalAngle = (g_globalAngle + 360) % 360;

    // Update the slider so it reflects the key press
    const slider = document.getElementById('cameraAngle');
    slider.value = g_globalAngle;
  });
  
  canvas.onclick = () => {
      canvas.requestPointerLock();
  };

    // Listen for pointer lock changes
  document.addEventListener('pointerlockchange', () => {
    const crosshair = document.getElementById('crosshair');
    if (document.pointerLockElement === canvas) {
      crosshair.style.display = 'block';
    } else {
      crosshair.style.display = 'none';
    }
  });

    // Handle relative mouse movement
    document.addEventListener('mousemove', (ev) => {
        if (document.pointerLockElement !== canvas) return;

        const deltaX = ev.movementX; // relative movement
        const deltaY = ev.movementY;

        const sensitivity = 0.2;
        g_camera.yaw(deltaX * sensitivity);
        g_camera.pitch(-deltaY * sensitivity);
    });

  canvas.addEventListener('mousedown', (ev) => {
    if (document.pointerLockElement !== canvas) return;

    const result = raycast();
    if (!result) return;

    if (ev.button === 0) {
      // Destroy
      g_mapHeights[result.hit.x][result.hit.z]--;
    }

    if (ev.button === 2) {
      // Place
      if (result.empty) {
        g_mapHeights[result.empty.x][result.empty.z]++;
      }
    }
  });

  renderShapes();
}

function initTextures() {

  var image = new Image();
  if(!image) {
    console.log('Failed to create the image object');
    return false;
  }

  // Skybox texture
  var image0 = new Image();
  image0.onload = function() { sendTextureToTEXTURE(image0, 0); }
  image0.src = 'sky.jpg';

  // Grass texture
  var image1 = new Image();
  image1.onload = function() { sendTextureToTEXTURE(image1, 1); }
  image1.src = 'WoodFloor.jpg';

  // Stone texture
  var image2 = new Image();
  image2.onload = function() { sendTextureToTEXTURE(image2, 2); }
  image2.src = 'smoothStone.jpeg';
  
  var image3 = new Image();
  image3.onload = function() { sendTextureToTEXTURE(image3, 3); }
  image3.src = 'text.jpeg';

  var image4 = new Image();
  image4.onload = function() { sendTextureToTEXTURE(image4, 4); }
  image4.src = 'diamond.jpg';

  var image5 = new Image();
  image5.onload = function() { sendTextureToTEXTURE(image5, 5); }
  image5.src = 'uvgraph.png';

  return true;
}

function sendTextureToTEXTURE(image, texUnit) {
  var texture = gl.createTexture();
  if(!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  // Select texture unit
  if (texUnit === 0) gl.activeTexture(gl.TEXTURE0);
  else if (texUnit === 1) gl.activeTexture(gl.TEXTURE1);
  else if (texUnit === 2) gl.activeTexture(gl.TEXTURE2);
  else if (texUnit === 3) gl.activeTexture(gl.TEXTURE3);
  else if (texUnit === 4) gl.activeTexture(gl.TEXTURE4);
  else if (texUnit === 5) gl.activeTexture(gl.TEXTURE5);

  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the sampler uniform to the correct texture unit
  if (texUnit === 0) gl.uniform1i(u_Sampler0, 0);
  else if (texUnit === 1) gl.uniform1i(u_Sampler1, 1)
  else if (texUnit === 2) gl.uniform1i(u_Sampler2, 2);
  else if (texUnit === 3) gl.uniform1i(u_Sampler3, 3);
  else if (texUnit === 4) gl.uniform1i(u_Sampler4, 4);
  else if (texUnit === 5) gl.uniform1i(u_Sampler5, 5);

  renderShapes();
  // gl.clear(gl.COLOR_BUFFER_BIT);
}

function getCameraForward() {
  let dir = new Vector3([
    g_camera.at.x - g_camera.eye.x,
    g_camera.at.y - g_camera.eye.y,
    g_camera.at.z - g_camera.eye.z
  ]);
  dir.normalize();
  return dir;
}

function raycast(maxDist = 6, step = 0.1) {
  const origin = g_camera.eye;
  const dir = getCameraForward();

  let lastEmpty = null;

  for (let t = 0; t < maxDist; t += step) {
    let x = origin.x + dir.elements[0] * t;
    let y = origin.y + dir.elements[1] * t;
    let z = origin.z + dir.elements[2] * t;

    let mapX = Math.floor(x + WORLD_SIZE/2);
    let mapZ = Math.floor(z + WORLD_SIZE/2);
    let mapY = Math.floor(y + 0.75);

    if (
      mapX >= 0 && mapX < WORLD_SIZE &&
      mapZ >= 0 && mapZ < WORLD_SIZE
    ) {
      if (mapY >= 0 && mapY < g_mapHeights[mapX][mapZ]) {
        return { hit: {x:mapX,y:mapY,z:mapZ}, empty: lastEmpty };
      } else {
        lastEmpty = {x:mapX,y:mapY,z:mapZ};
      }
    }
  }

  return null;
}

function main() {

  // Setup canvas and gl Variables
  setupWebGL();

  // Setup GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Clicking Events for Buttong
  UIElements();

  document.onkeydown = keydown;

  initTextures();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0-g_startTime;
let lastFrameTime = performance.now();
let fps = 0;
var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

function tick() {
  const now = performance.now();
  g_seconds = performance.now()/1000.0-g_startTime;
  const delta = (now - lastFrameTime) / 1000; // seconds since last frame
  lastFrameTime = now;
  // console.log(performance.now());
  fps = 1 / delta;
  g_seconds = now / 1000.0 - g_startTime;
  updateAnimationAngles();

  // Draw Everything
  renderShapes();

  sendTextToHtml("FPS: " + Math.floor(fps), "numdot");

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

      g_bodyAngle = minAngle + (raw + 1) * (maxAngle - minAngle) / 2;
    }
}

function keydown(ev) {
  if (ev.keyCode == 38 || ev.key === 'w') {        // Up arrow or W key
    g_camera.forward();
  }
  else if (ev.keyCode == 40 || ev.key === 's') {   // Down arrow or S key
    g_camera.backward();
  }
  else if (ev.keyCode == 37 || ev.key === 'a') {   // Left arrow or A key
    g_camera.left();
  }
  else if (ev.keyCode == 39 || ev.key === 'd') {   // Right arrow or D key
    g_camera.right();
  }
}

// var g_eye = [0,0,3];
// var g_at = [0,0,0];
// var g_up = [0,1,0];
// Seeded random number generator
function seededRandom(seed) {
    let value = seed % 2147483647;
    if (value <= 0) value += 2147483646;
    return function() {
        value = (value * 16807) % 2147483647;
        return (value - 1) / 2147483646;
    }
}

const WORLD_SIZE = 32;
var g_mapHeights = Array(WORLD_SIZE)
  .fill(0)
  .map(() => Array(WORLD_SIZE).fill(0));

// Make borders one cube tall
for (let x = 0; x < WORLD_SIZE; x++) {
  g_mapHeights[x][0] = 1;
  g_mapHeights[x][WORLD_SIZE-1] = 1;
}
for (let y = 0; y < WORLD_SIZE; y++) {
  g_mapHeights[0][y] = 1;
  g_mapHeights[WORLD_SIZE-1][y] = 1;
}

// Random walls for a simple maze/hallways
const seed = 12345;          // any number you want
const rand = seededRandom(seed);

// Random walls for a simple maze/hallways
for (let x = 1; x < WORLD_SIZE-1; x++) {
  for (let y = 1; y < WORLD_SIZE-1; y++) {
    if (rand() < 0.2) { // 20% chance to place a wall
      g_mapHeights[x][y] = 1 + Math.floor(rand() * 3); // stack 1-3 cubes
    }
  }
}

function drawMap() {
  var wall = new Cube();
  for (var x = 0; x < WORLD_SIZE; x++) {
    for (var y = 0; y < WORLD_SIZE; y++) {
      let height = g_mapHeights[x][y];
      for (let h = 0; h < height; h++) {
        wall.color = [0.5, 0.5, 0.5, 1.0];

        if (x == 1 && y == 3) {
          wall.textureNum = 4; // Diamond texture for the "treasure"
        }
        else {
          wall.textureNum = 2;
        }
        wall.matrix.setIdentity();
        wall.matrix.translate(x - WORLD_SIZE/2, h * 1.0 - 0.75, y - WORLD_SIZE/2);
        wall.renderFaster();
      }
    }
  }
}

function renderShapes(){

  // var startTime = performance.now();

  // Pass the projection matrix
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(60, canvas.width/canvas.height, .1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);

  // Pass the view matrix
  var viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
    g_camera.at.x, g_camera.at.y, g_camera.at.z,
    g_camera.up.x, g_camera.up.y, g_camera.up.z
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // Pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the floor
  var floor = new Cube();
  floor.color = [1, 0, 0, 1.0];
  floor.textureNum = 1;
  floor.matrix.translate(0, -0.75, 0);
  floor.matrix.scale(32, 0.01, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.renderFaster();

  // Draw the skybox
  var skybox = new Cube();
  skybox.color = [1, 1, 1, 1.0];
  skybox.textureNum = 0;
  skybox.matrix.scale(50, 50, 50);
  skybox.matrix.translate(-0.5, -0.5, -0.5);
  skybox.renderFaster();

  // Render each shape in the list
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.textureNum = 3;
  body.matrix.translate(-0.5, -.75, 0.0);
  body.matrix.scale(1, 1, 1);
  body.renderFaster();

  // Render each shape in the list
  var hint = new Cube();
  hint.color = [1.0, 0.0, 0.0, 1.0];
  hint.textureNum = 5;
  hint.matrix.translate(0.5, -.75, 0.0);
  hint.matrix.scale(1, 1, 1);
  hint.renderFaster();

  drawMap();
  animal(15,g_mapHeights[17][17] + 0.75,18);
}

function animal(worldX, worldY, worldZ) {
  gl.uniform1i(u_whichTexture, -2); // plain color
  let worldMatrix = new Matrix4();
  worldMatrix.translate(
    worldX - WORLD_SIZE/2,
    worldY - 0.75, 
    worldZ - WORLD_SIZE/2
  );
  worldMatrix.rotate(180, 0, 1, 0);
 // Draw Head
  var head = new Sphere();
  head.matrix = new Matrix4(worldMatrix);
  head.matrix.translate(0, 0, 0.35);

  // Save joint space BEFORE scale
  var headJoint = new Matrix4(head.matrix);

  // HEAD SHAPE
  head.color = [0.35, 0.3, 0.25, 1.0];
  head.textureNum = -2;
  head.matrix.scale(0.25, 0.22, 0.25);
  head.render();

  // Draw Face
  var face = new Sphere();
  face.matrix = new Matrix4(headJoint);  // attach to head JOINT
  face.color = [0.7, 0.6, 0.5, 1.0];
  face.textureNum = -2;
  face.matrix.translate(0, 0, -0.095);

  var faceJoint = new Matrix4(face.matrix);

  face.matrix.scale(0.2, 0.16, 0.18);
  face.render();


  var eye1 = new Sphere();
  eye1.matrix = new Matrix4(faceJoint);
  eye1.color = [0,0,0,1];
  eye1.textureNum = -2;
  eye1.matrix.translate(-0.07, 0.05, -0.125);
  eye1.matrix.scale(0.03,0.03,0.03);
  eye1.render();

  var eye2 = new Sphere();
  eye2.matrix = new Matrix4(faceJoint);
  eye2.color = [0,0,0,1];
  eye2.textureNum = -2;
  eye2.matrix.translate(0.07, 0.05, -0.125);
  eye2.matrix.scale(0.03,0.03,0.03);
  eye2.render();

  var nose = new Sphere();
  nose.matrix = new Matrix4(faceJoint);
  nose.color = [0,0,0,1];
  nose.textureNum = -2;
  nose.matrix.translate(0, 0.0, -0.15);
  nose.matrix.scale(0.04,0.04,0.04);
  nose.render();


  var mouth = new Sphere();
  mouth.matrix = new Matrix4(faceJoint);
  mouth.color = [0,0,0,1];
  mouth.matrix.translate(0, -0.06, -0.15);
  mouth.matrix.scale(0.08,0.02,0.02);
  mouth.render();


  // if (g_tongueAnimation) {
  //   var tongue = new Sphere();
  //   tongue.matrix = new Matrix4(faceJoint);
  //   tongue.color = [1.0, 0.3, 0.4, 1.0];

  //   // joint position
  //   tongue.matrix.translate(0, -0.04, -0.12);

  //   // point downward first
  //   tongue.matrix.rotate(-40, 1, 0, 0);

  //   // sway left-right
  //   tongue.matrix.rotate(g_tongueAngle, 0, 1, 0);

  //   tongue.matrix.scale(0.05, 0.01, 0.12);
  //   tongue.render();
  // }


  // Draw Body
  var body = new Sphere();
  body.matrix = new Matrix4(worldMatrix); 
  body.color = [0.35, 0.3, 0.25, 1.0];
  body.textureNum = -2;
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
  rightArm.textureNum = -2;
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
  rightElbow.textureNum = -2;
  rightElbow.matrix.translate(-0.075, 0.09, 0.45);
  rightElbow.matrix.rotate(g_rightElbowAngle,1,0,0);

  rightElbow.matrix.scale(0.15, .15, 0.4);  
  rightElbow.matrix.translate(0, -0.5, 0);
  rightElbow.render();

  // Draw a left arm
  var leftArm = new Cube();
  leftArm.matrix = new Matrix4(bodyMat);

  leftArm.color = [0.35, 0.3, 0.25, 1.0];
  leftArm.textureNum = -2;
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
  leftElbow.textureNum = -2;
  leftElbow.matrix.translate(-0.075, 0.1, 0.35);

  leftElbow.matrix.rotate(g_leftElbowAngle,1,0,0);

  leftElbow.matrix.scale(0.15, .15, 0.4);  
  leftElbow.matrix.translate(0, -0.5, 0);
  leftElbow.render();

  // Right Leg
  var rightLeg = new Cube();
  rightLeg.matrix = new Matrix4(bodyMat);  

  rightLeg.color = [0.32, 0.28, 0.24, 1.0];
  rightLeg.textureNum = -2;
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
  rightFoot.textureNum = -2;
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
  leftLeg.textureNum = -2;
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
  leftFoot.textureNum = -2;
  // Translate to ankle/foot position relative to the leg
  leftFoot.matrix.translate(0, 0.1, 0.3);  // move forward along Z, tweak if needed

  // Optional: rotate foot slightly
  leftFoot.matrix.rotate(g_leftFootAngle, 1, 0, 0);   // tilt foot forward slightly

  // Scale the foot shape
  leftFoot.matrix.scale(0.15, 0.15, 0.25);  // make it shorter and flatter than the leg

  leftFoot.render();
}

function sendTextToHtml(text, htmlID) {
  var htmlElem = document.getElementById(htmlID);
  if(!htmlElem) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElem.innerHTML = text;
}