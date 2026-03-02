// World.js (c) 2012 matsuda

// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = vec2(a_UV.y, 1.0 - a_UV.x);
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
    v_VertPos = u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4, u_Sampler5;
  uniform int u_whichTexture;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  uniform bool u_lightOn;
  varying vec4 v_VertPos;

  void main() {
    if(u_whichTexture == -2) {    
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == -3) {
      gl_FragColor = vec4((v_Normal + 1.0)/2.0, 1.0); // Use normal
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

    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r = length(lightVector);

    // Red Green Distance Visualization
    // if (r < 1.0) {
    //   gl_FragColor = vec4(1, 0, 0, 1);
    // } else if (r < 2.0){
    //   gl_FragColor = vec4(0,1,0,1);
    // }

    // Light Falloff Visualization
    // gl_FragColor = vec4(vec3(gl_FragColor)/(r*r), 1);

    // N dot L Visualization
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N, L), 0.0);

    float specular = 0.0;
    if(u_whichTexture != 0) { // assuming 2 is your wall texture
        vec3 R = reflect(-L,N);
        vec3 E = normalize(u_cameraPos-vec3(v_VertPos));
        specular = pow(max(dot(E,R), 0.0), 100.0);
    }

    vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
    vec3 ambient = vec3(gl_FragColor) * 0.2;
    if (u_lightOn) {
      if (u_whichTexture == 0) {
        gl_FragColor = vec4(specular+diffuse+ambient, 1.0);
      } else {
        gl_FragColor = vec4(diffuse+ambient, 1.0);
      }
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
let a_Normal;
let u_lightPos;
let u_cameraPos;
let u_lightOn;
let u_NormalMatrix;

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

  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
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

let g_NormalOn = false;

// Light Positions
let g_lightPos = [0,5,-2];
let g_lightOn = false;

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

  document.getElementById('lightX').addEventListener('mousemove', function(ev) {
      if(ev.buttons == 1) {
      g_lightPos[0] = this.value/10;
    }
  });

  document.getElementById('lightY').addEventListener('mousemove', function(ev) {
    if(ev.buttons == 1) { 
      g_lightPos[1] = this.value/10;
    }
  });

  document.getElementById('lightZ').addEventListener('mousemove', function(ev) {
    if (ev.buttons == 1) {
      g_lightPos[2] = this.value/10;
    }
  });

  document.getElementById("normalToggleBtn").onclick = function() {
    g_NormalOn = !g_NormalOn;
    this.textContent = g_NormalOn ? "Normals: ON" : "Normals: OFF";
  };

  document.getElementById("lightOnBtn").onclick = function() {
    g_lightOn = !g_lightOn;
    this.textContent = g_lightOn ? "Light: ON" : "Light: OFF";
  };
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

  car = new Model("coffee.obj");
  car.normalMatrix = new Matrix4();

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
    // if(g_tongueAnimation) {
    //   g_tongueAngle = 30*Math.sin(30 * g_seconds);
    // }
    // if(g_standAnimation) {
    //   let raw = Math.sin(g_seconds);   // -1 to 1
    //   let minAngle = 15;
    //   let maxAngle = 30;

    //   g_bodyAngle = minAngle + (raw + 1) * (maxAngle - minAngle) / 2;
    // }
    g_lightPos[0] = cos(g_seconds);
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
          if (g_NormalOn) wall.textureNum = -3; // Normal visualization
          else wall.textureNum = 2;
        }
        wall.matrix.setIdentity();
        wall.matrix.translate(x - WORLD_SIZE/2, h * 1.0 - 0.75, y - WORLD_SIZE/2);
        wall.renderNormal();
      }
    }
  }
}

// let car = new Model("carEdited.obj");

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
  // gl.clear(gl.COLOR_BUFFER_BIT);

  // Pass the Light Position to GLSL
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);

  // Pass the Camera Position to GLSL
  gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);

  // Turn Light ON/OFF
  gl.uniform1i(u_lightOn, g_lightOn);

  // Draw the Light
  var light = new Cube();
  light.color = [2,2,0,1];
  light.textureNum = -2;
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-0.1, -0.1, -0.1);
  light.matrix.translate(-0.5, -0.5, -0.5);
  light.renderNormal();

  // Draw the normal sphere
  var sp = new NormalSphere();
  if (g_NormalOn) sp.textureNum = -3;
  sp.matrix.translate(-1, 0, -1.5);

  // Compute normal matrix for correct lighting
  var normalMat = new Matrix4();
  normalMat.set(sp.matrix);
  normalMat.invert();
  normalMat.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMat.elements);

  sp.render();
  
  // Draw the floor
  var floor = new Cube();
  floor.color = [1, 0, 0, 1.0];
  if (g_NormalOn) floor.textureNum = -3;
  else floor.textureNum = 1;
  floor.matrix.translate(0, -0.75, 0);
  floor.matrix.scale(32, 0.01, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.renderNormal();

  // Draw the skybox
  var skybox = new Cube();
  skybox.color = [1, 1, 1, 1];
  if (g_NormalOn) skybox.textureNum = -3;
  else skybox.textureNum = 0;
  skybox.matrix.scale(-50, -50, -50);
  skybox.matrix.translate(-0.5, -0.5, -0.5);
  skybox.renderNormal();

  // Render each shape in the list
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  if (g_NormalOn) body.textureNum = -3;
  else body.textureNum = 3;
  body.matrix.translate(-0.5, -.75, 0.0);
  body.matrix.scale(1, -1, 1);
  body.renderNormal();

  // Render each shape in the list
  var hint = new Cube();
  hint.color = [1.0, 0.0, 0.0, 1.0];
  if (g_NormalOn) hint.textureNum = -3;
  else hint.textureNum = 5;
  hint.matrix.translate(0.5, -.75, 0.0);
  hint.matrix.scale(1, -1, 1);
  hint.renderNormal();

  drawMap();
  
  // car.matrix.setIdentity();
  // car.matrix.scale(0.6, 0.5, 0.5);
  // car.matrix.rotate(240, 0, 1, 0);
  // car.matrix.translate(7, 0, 0);
  // var normalMat = new Matrix4();
  // normalMat.set(car.matrix);  // copy model matrix
  // normalMat.invert();          // invert
  // normalMat.transpose();       // transpose
  // car.normalMatrix.set(normalMat);
  // car.render();

}

function sendTextToHtml(text, htmlID) {
  var htmlElem = document.getElementById(htmlID);
  if(!htmlElem) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElem.innerHTML = text;
}
