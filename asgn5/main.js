import * as THREE from 'three';
import './app.css';

// Scene & Camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  20
);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 3);
light.position.set(-1, 2, 4);
scene.add(light);

// Geometry
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

// Preload textures
const loader = new THREE.TextureLoader();
const texturePaths = [
  'textures/flower-1.jpg',
  'textures/flower-2.jpg',
  'textures/flower-3.jpg',
  'textures/flower-4.jpg',
  'textures/flower-5.jpg',
  'textures/flower-6.jpg',
];
const textures = texturePaths.map(path => {
  const tex = loader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
});

// Function to create a cube
function makeCube(x) {
  const materials = textures.map(tex => new THREE.MeshPhongMaterial({ map: tex }));
  const cube = new THREE.Mesh(boxGeometry, materials);
  cube.position.x = x;
  scene.add(cube);
  return cube;
}

// Create cubes
const cubes = [
  makeCube(-2),
  makeCube(0),
  makeCube(2),
];

// Animation loop
function render(time) {
  time *= 0.001; // seconds

  cubes.forEach((cube, i) => {
    const speed = 1 + i * 0.1;
    cube.rotation.x = time * speed;
    cube.rotation.y = time * speed;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

// Start animation
requestAnimationFrame(render);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});