// Import Three.js and necessary modules
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2a2a);
scene.fog = new THREE.Fog(0x2a2a2a, 10, 150);

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(9.1958, 55.8507, 4.7656);
camera.lookAt(17, 63, 8.78);

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
document.getElementById("container3D").appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-0.6959, 46, -0.3652);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.update();

// Helpers
scene.add(new THREE.GridHelper(60, 10, 0x888888, 0x444444));
scene.add(new THREE.AxesHelper(25));

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
directionalLight.castShadow = true;
scene.add(directionalLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

// Shadow-receiving plane
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

// Tagging System
const tagOffset = new THREE.Vector3(0, 1, -0.5); // Offset above anchor
const tagData = [
  { name: "TML-001", position: new THREE.Vector3(3.0819, 52.2439, -2.1439) },
  { name: "TML-002", position: new THREE.Vector3(3.5960, 51.9114, -2.4790) }
];

// Function to create text textures
function createTextTexture(text) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = 256; // Texture resolution
  canvas.height = 128;

  // Draw background
  context.fillStyle = "rgba(0, 0, 0, 0.7)"; // Semi-transparent background
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Draw text
  context.font = "50px Arial";
  context.fillStyle = "#ffffff"; // White text
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create tag boxes in world space
const tags = tagData.map(({ name, position }) => {
  // Create Sprite for tag box
  const tagMaterial = new THREE.SpriteMaterial({
    map: createTextTexture(name),
    sizeAttenuation: false, // Prevent scaling with distance
  });
  const tagBox = new THREE.Sprite(tagMaterial);
  tagBox.position.copy(position.clone().add(tagOffset)); // Position above anchor
  tagBox.scale.set(0.1, 0.05, 0.05);
  scene.add(tagBox);

  // Create line connecting anchor to tag box
  const points = [
    position.clone(), // Anchor position
    tagBox.position,  // Tag box position
  ];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);

  return { tagBox, line, position };
  });

// Show anchor (red) spheres
const sphereGeometry = new THREE.SphereGeometry(0.01, 3, 3);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
tagData.forEach(({ position }) => {
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.position.copy(position);
  scene.add(sphere);
});

// ✅ Show tag box world position (green spheres)
const greenSphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
tagData.forEach(({ position }) => {
  const greenSphere = new THREE.Mesh(sphereGeometry, greenSphereMaterial);
  greenSphere.position.copy(position.clone().add(tagOffset));
  scene.add(greenSphere);
});

// Load GLTF Model
const loader = new GLTFLoader();
loader.load("models/koyasu/untitled.glb", (gltf) => {
  const model = gltf.scene;
  scene.add(model);
});

// Resize Handler
window.addEventListener('resize', () => {
  const width = window.innerWidth; // Get the new window width
  const height = window.innerHeight; // Get the new window height
  // Update camera
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  // Update renderer
  renderer.setSize(width, height);
});

// Raycast Click
// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector3();
// renderer.domElement.addEventListener('click', (event) => {
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(scene.children, true);

//   if (intersects.length > 0) {
//     const point = intersects[0].point;
//     console.log('Clicked 3D point (Vector3):', point);
//     const marker = new THREE.Mesh(
//       new THREE.SphereGeometry(0.1, 16, 16),
//       new THREE.MeshBasicMaterial({ color: 0xff0000 })
//     );
//     marker.position.copy(point);
//     scene.add(marker);
//   }
// });

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Update tag boxes to face the camera and refresh lines
  tags.forEach(({ tagBox, line, position }) => {
    tagBox.quaternion.copy(camera.quaternion); // Make tag box face the camera
    // Update line geometry
    const points = [position.clone(), tagBox.position];
    line.geometry.setFromPoints(points);
  });

  renderer.render(scene, camera);
}
animate();
