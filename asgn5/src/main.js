import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Enable shadows on renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(8, 1, 1);
camera.rotation.order = 'YXZ';

// Pointer lock
const canvas = renderer.domElement;
canvas.addEventListener('click', () => {
  if (!isDead) canvas.requestPointerLock();
});
const mouse = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === canvas) {
    mouse.x -= e.movementX * 0.002;
    mouse.y -= e.movementY * 0.002;
    mouse.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouse.y));
  }
});

// Respawn screen
let isDead = false;
const SPAWN_X = 8;
const SPAWN_Y = 1;
const SPAWN_Z = 1;

const respawnScreen = document.getElementById('respawn');
document.getElementById('respawnBtn').addEventListener('click', () => {
  camera.position.set(SPAWN_X, SPAWN_Y, SPAWN_Z);
  mouse.x = 0;
  mouse.y = 0;
  velocityY = 0;
  isFlying = false;
  isDead = false;
  respawnScreen.style.display = 'none';
  canvas.requestPointerLock();
});

// Sun Lighting
const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(4.5, 15, 4);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 100;
light.shadow.camera.left = -20;
light.shadow.camera.right = 20;
light.shadow.camera.top = 20;
light.shadow.camera.bottom = -20;
scene.add(light);

// Slight Ambience
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const indoorLight = new THREE.PointLight(0xffa060, 2, 50);
indoorLight.position.set(8, 2, 0);
scene.add(indoorLight);

// Glowing Bulb
const bulbGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
const bulb = new THREE.Mesh(bulbGeo, bulbMat);
bulb.position.set(8, 3.6, 0);
scene.add(bulb);

// Sphereus
const orbGeo = new THREE.SphereGeometry(0.6, 16, 16);
const orbMat = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // glowing cyan
const orb = new THREE.Mesh(orbGeo, orbMat);
scene.add(orb);

// Textures
const loader = new THREE.TextureLoader();

// Load Log
const trunkMeshes = [];
const mtlLoader = new MTLLoader();
mtlLoader.setResourcePath('models/');
mtlLoader.load('models/trunk.mtl', (materials) => {
  materials.preload();
  new OBJLoader().setMaterials(materials).load('models/trunk.obj', (obj) => {
    const tex = loader.load('models/log_diff.png');
    tex.colorSpace = THREE.SRGBColorSpace;
    obj.traverse((child) => {
      if (child.isMesh) {
        child.material.map = tex;
        child.material.needsUpdate = true;
        child.material.side = THREE.DoubleSide;
        trunkMeshes.push(child);
      }
    });
    obj.scale.set(4, 4, 4);
    obj.rotation.y = -45; 
    obj.position.set(-2, -8, -30); 
    scene.add(obj);
  });
});

// Skybox
new THREE.TextureLoader().load('textures/forest1.jpg', (tex) => {
  tex.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = tex;
});

// Leaf texture
const leafTex = loader.load('textures/leaf.jpg');
leafTex.colorSpace = THREE.SRGBColorSpace;

const leaves = []; // 👈 track for raycasting

function makeLeaf(x, z, rotY, scale = 1) {
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo( 10, 5,  20, 15,  0, 25);
  leafShape.bezierCurveTo(-20, 15, -10, 5,   0, 0);

  const tex = leafTex.clone();
  tex.needsUpdate = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.08, 0.08);

  const geo = new THREE.ShapeGeometry(leafShape);
  const mat = new THREE.MeshPhongMaterial({ map: tex, side: THREE.DoubleSide, shininess: 5 });
  const leaf = new THREE.Mesh(geo, mat);
  leaf.rotation.x = -Math.PI / 2;
  leaf.rotation.z = rotY; 
  leaf.position.set(x, -1, z);
  leaf.scale.setScalar(scale);
  scene.add(leaf);
  leaves.push(leaf);
  return leaf;
}
makeLeaf(0, 5, 0, 1.0);
makeLeaf(0, 5, 90, 1.0);
makeLeaf(0, 5, 180, 1.0);

// Building
const buildingTex = loader.load('textures/oak.png');
buildingTex.colorSpace = THREE.SRGBColorSpace;
const buildingBlocks = [];

function makeBlock(x, y, z, w = 1.5, h = 1.5, d = 1.5) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshPhongMaterial({ map: buildingTex , shininess: 0 });
  const block = new THREE.Mesh(geo, mat);
  block.position.set(x, y, z);
  block.castShadow = true;
  block.receiveShadow = true;
  scene.add(block);
  buildingBlocks.push(block);
  return block;
}

// Floor
for (let x = -2; x <= 2; x++) {
  for (let z = -2; z <= 2; z++) {
    makeBlock(x * 1.5 + 8, -1.5, z * 1.5);
  }
}

// Side Walls
for (let y = 0; y <= 2; y++) {
  // Front and back walls (full width including corners)
  for (let x = -2; x <= 2; x++) {
    makeBlock(x * 1.5 + 8, y * 1.5, -3);

    // const isDoor = (x === 0) && (y === 0 || y === 1);
    makeBlock(x * 1.5 + 8, y * 1.5, 3);
  }

  // Side walls
  for (let z = -1; z <= 1; z++) {
    const isSideDoor = (z === 0) && (y === 0 || y === 1);
    if (!isSideDoor) makeBlock(5, y * 1.5, z * 1.5);

    makeBlock(11, y * 1.5, z * 1.5);
  }
}


// Roof
for (let x = -2; x <= 2; x++) {
  for (let z = -2; z <= 2; z++) {
    makeBlock(x * 1.5 + 8, 4.5, z * 1.5);
  }
}

// Roofing
const coneGeo = new THREE.ConeGeometry(6, 6, 4); // radius, height, segments
const coneMat = new THREE.MeshPhongMaterial({ color:   0x228B22, shininess: 1 });
const cone = new THREE.Mesh(coneGeo, coneMat);
cone.position.set(8, 8, 0);
cone.rotation.y = THREE.MathUtils.degToRad(45);
cone.castShadow = true;
cone.receiveShadow = true;
scene.add(cone);

function makeTextBlock(x, y, z, lines) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#3b2a1a';
  ctx.fillRect(0, 0, 512, 512);

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(lines[0], 256, 50);

  // Divider
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 70);
  ctx.lineTo(472, 70);
  ctx.stroke();

  // Controls
  ctx.fillStyle = '#ffffff';
  ctx.font = '26px Arial';
  lines.slice(1).forEach((line, i) => {
    ctx.fillText(line, 256, 110 + i * 60);
  });

  const tex = new THREE.CanvasTexture(canvas);
  const geo = new THREE.BoxGeometry(3, 3, 0.2); 
  const materials = [
    new THREE.MeshPhongMaterial({ map: buildingTex }),
    new THREE.MeshPhongMaterial({ map: buildingTex }),
    new THREE.MeshPhongMaterial({ map: buildingTex }),
    new THREE.MeshPhongMaterial({ map: buildingTex }),
    new THREE.MeshPhongMaterial({ map: tex }),          // front face
    new THREE.MeshPhongMaterial({ map: buildingTex }),
  ];

  const block = new THREE.Mesh(geo, materials);
  block.position.set(x, y, z);
  block.castShadow = true;
  block.receiveShadow = true;
  scene.add(block);
  return block;
}

makeTextBlock(8, 0.5, -2, [
  'Controls',
  'WASD — Movement',
  'Space — Jump',
  'Shift — Sprint',
  'Double Space — Fly (Q up, E down)',
  'F — Flashlight',
  '1 — Day / Night',
]);

// GLB Loader
let mixer;
let model;
let walkDirection = 1;
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  'models/camboto.glb',
  (gltf) => {
    model = gltf.scene;
    model.position.set(-5, -1, 0);
    model.scale.set(1, 1, 1);
    model.rotation.y = Math.PI / 2;
    scene.add(model);
    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      mixer.timeScale = 0.25;
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
    }
  },
  (progress) => console.log('Loading...', (progress.loaded / progress.total * 100).toFixed(1) + '%'),
  (error) => console.error('GLB load error:', error)
);

// Keyboard
const keys = {};
let isFlying = false;
let lastSpaceTime = 0;
let velocityY = 0;
const DOUBLE_TAP_THRESHOLD = 300;
const GRAVITY = -20;
const JUMP_FORCE = 8;
const FALL_DEATH_Y = -30;

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') {
     e.preventDefault();
    const now = performance.now();
    if (now - lastSpaceTime < DOUBLE_TAP_THRESHOLD) {
      isFlying = !isFlying;
      velocityY = 0;
    }
    lastSpaceTime = now;
  }
  if (e.code === 'KeyF') {
    flashlightOn = !flashlightOn;
    flashlight.intensity = flashlightOn ? 35 : 0;
  }
  if (e.code === 'Digit1') {
    isNight = !isNight;
    if (isNight) {
      light.intensity = 0;
      ambientLight.intensity = 0.05;
    } else {
      light.intensity = 2;
      ambientLight.intensity = 0.1;
    }
  }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

const flashlight = new THREE.SpotLight(0xffffff, 0, 30, Math.PI / 8, 0.3);
const flashlightTarget = new THREE.Object3D();
scene.add(flashlight);
scene.add(flashlightTarget);
flashlight.target = flashlightTarget;

let flashlightOn = false;
let isNight = false;

const WALK_SPEED = 2;
const CAMERA_SPEED = 5;
const LEFT_BOUND = -5;
const RIGHT_BOUND = 5;

// Raycaster for leaf collision
const raycaster = new THREE.Raycaster();

const allCollidables = () => [...leaves, ...buildingBlocks, ...trunkMeshes];
const down = new THREE.Vector3(0, -1, 0);

// Resize helper
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) renderer.setSize(width, height, false);
  return needResize;
}

// GUI
const gui = new GUI();
gui.add(camera, 'fov', 1, 180).onChange(() => camera.updateProjectionMatrix());
const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(() => camera.updateProjectionMatrix());
gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(() => camera.updateProjectionMatrix());

// Render loop
let lastTime = 0;
function render(time) {
  time *= 0.001;
  const delta = time - lastTime;
  lastTime = time;

  if (!isDead) {
    camera.rotation.y = mouse.x;
    camera.rotation.x = mouse.y;

    const sprint = keys['ShiftLeft'] || keys['ShiftRight'];
    const moveDistance = (sprint ? CAMERA_SPEED * 3 : CAMERA_SPEED) * delta;

    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    if (keys['KeyW'] || keys['ArrowUp'])    camera.position.addScaledVector(forward,  moveDistance);
    if (keys['KeyS'] || keys['ArrowDown'])  camera.position.addScaledVector(forward, -moveDistance);
    if (keys['KeyD'] || keys['ArrowRight']) camera.position.addScaledVector(right,    moveDistance);
    if (keys['KeyA'] || keys['ArrowLeft'])  camera.position.addScaledVector(right,   -moveDistance);

    if (isFlying) {
      if (keys['Space']) camera.position.y += moveDistance;
      if (keys['KeyQ'])  camera.position.y += moveDistance;
      if (keys['KeyE'])  camera.position.y -= moveDistance;
    } else {
      // Raycast down to check if over a leaf
      raycaster.set(camera.position, down);
      const intersects = raycaster.intersectObjects([...leaves, ...buildingBlocks, ...trunkMeshes], true);
      const onLeaf = intersects.length > 0 && intersects[0].distance < 1.5;
      const groundLevel = onLeaf ? intersects[0].point.y + 1 : FALL_DEATH_Y;

      if (keys['Space'] && onLeaf && camera.position.y <= groundLevel + 0.1) {
        velocityY = JUMP_FORCE;
        keys['Space'] = false;
      }

      velocityY += GRAVITY * delta;
      camera.position.y += velocityY * delta;

      if (camera.position.y <= groundLevel && onLeaf) {
        camera.position.y = groundLevel;
        velocityY = 0;
      }
      // Ground
      if (camera.position.y <= FALL_DEATH_Y) {
        isDead = true;
        respawnScreen.style.display = 'flex';
        document.exitPointerLock();
      }
    }

    // Spinning orb above cone
    orb.position.x = 8;
    orb.position.y = 14 + Math.sin(time * 2) * 0.5;
    orb.rotation.y = time * 2;

    if (mixer) mixer.update(delta);

    if (model) {
      model.position.x += WALK_SPEED * walkDirection * delta;
      if (model.position.x > RIGHT_BOUND) {
        walkDirection = -1;
        model.rotation.y = -Math.PI / 2;
      }
      if (model.position.x < LEFT_BOUND) {
        walkDirection = 1;
        model.rotation.y = Math.PI / 2;
      }
    }
    flashlight.position.copy(camera.position);

    const flashlightDir = new THREE.Vector3();
    camera.getWorldDirection(flashlightDir);
    flashlightTarget.position.copy(camera.position).addScaledVector(flashlightDir, 5);
  }

  resizeRendererToDisplaySize(renderer);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, canvas.clientWidth, canvas.clientHeight);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});