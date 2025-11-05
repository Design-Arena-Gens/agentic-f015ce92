import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/PointerLockControls.js";

const blockSize = 1;
const halfBlock = blockSize / 2;

const blockCatalog = [
  { id: "grass", color: 0x5cba47, label: "1", description: "Grass" },
  { id: "dirt", color: 0x8b5a2b, label: "2", description: "Dirt" },
  { id: "stone", color: 0x8f8f8f, label: "3", description: "Stone" },
  { id: "plank", color: 0xd8b584, label: "4", description: "Plank" },
  { id: "glass", color: 0xa2c7ff, label: "5", description: "Glass", transparent: true, opacity: 0.55 },
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = "viewport";
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
controls.getObject().position.set(0, 6, 12);
scene.add(controls.getObject());

const clock = new THREE.Clock();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
sunLight.position.set(40, 60, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const groundGeometry = new THREE.PlaneGeometry(400, 400, 10, 10);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3a9a3a });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
const blockMaterials = new Map(
  blockCatalog.map((block) => [
    block.id,
    new THREE.MeshStandardMaterial({
      color: block.color,
      metalness: block.id === "glass" ? 0.1 : 0.0,
      roughness: 0.8,
      transparent: Boolean(block.transparent),
      opacity: block.opacity ?? 1,
    }),
  ])
);

const blockGroup = new THREE.Group();
scene.add(blockGroup);

const blockIndex = new Map();

function coordKey(x, y, z) {
  return `${x},${y},${z}`;
}

function gridToWorld(coord) {
  return coord * blockSize + halfBlock;
}

function addBlock(gridX, gridY, gridZ, type, options = {}) {
  const key = coordKey(gridX, gridY, gridZ);
  if (blockIndex.has(key)) return null;
  const material = blockMaterials.get(type);
  if (!material) return null;
  const mesh = new THREE.Mesh(blockGeometry, material);
  mesh.position.set(gridToWorld(gridX), gridToWorld(gridY), gridToWorld(gridZ));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    gridX,
    gridY,
    gridZ,
    type,
    permanent: Boolean(options.permanent),
  };
  blockGroup.add(mesh);
  blockIndex.set(key, mesh);
  return mesh;
}

function removeBlock(mesh) {
  if (!mesh || mesh.userData.permanent) return false;
  const { gridX, gridY, gridZ } = mesh.userData;
  const key = coordKey(gridX, gridY, gridZ);
  blockGroup.remove(mesh);
  blockIndex.delete(key);
  return true;
}

const chunkSize = 28;
for (let x = -chunkSize; x <= chunkSize; x++) {
  for (let z = -chunkSize; z <= chunkSize; z++) {
    addBlock(x, 0, z, "grass", { permanent: true });
    const mound = Math.random() < 0.18 ? 1 + Math.floor(Math.random() * 3) : 0;
    for (let y = 1; y <= mound; y++) {
      const type = y === mound ? "grass" : "dirt";
      addBlock(x, y, z, type, { permanent: y === 0 });
    }
  }
}

const highlightMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.9,
});
const highlightMesh = new THREE.LineSegments(new THREE.EdgesGeometry(blockGeometry), highlightMaterial);
highlightMesh.scale.setScalar(1.01);
highlightMesh.visible = false;
scene.add(highlightMesh);

const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector2(0, 0);

let lastHit = null;

function updateHighlight() {
  if (!controls.isLocked) {
    highlightMesh.visible = false;
    lastHit = null;
    return;
  }
  raycaster.setFromCamera(mouseVector, camera);
  const intersections = raycaster.intersectObjects(Array.from(blockIndex.values()));
  if (intersections.length === 0) {
    highlightMesh.visible = false;
    lastHit = null;
    return;
  }
  const hit = intersections[0];
  highlightMesh.visible = true;
  highlightMesh.position.copy(hit.object.position);
  lastHit = hit;
}

let activeInventoryIndex = 0;
const lockButton = document.getElementById("lockButton");
const inventoryRoot = document.getElementById("inventory");

function hex(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function refreshInventoryUI() {
  if (!inventoryRoot) return;
  inventoryRoot.innerHTML = "";
  blockCatalog.forEach((block, index) => {
    const slot = document.createElement("button");
    slot.className = "inventory-slot" + (activeInventoryIndex === index ? " active" : "");
    slot.textContent = block.label;
    slot.title = block.description;
    slot.style.background = block.transparent
      ? "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(162,199,255,0.8))"
      : hex(block.color);
    slot.addEventListener("click", () => {
      activeInventoryIndex = index;
      refreshInventoryUI();
    });
    inventoryRoot.appendChild(slot);
  });
}

refreshInventoryUI();

lockButton.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => {
  lockButton.classList.add("hidden");
  updateHighlight();
});
controls.addEventListener("unlock", () => {
  lockButton.classList.remove("hidden");
  highlightMesh.visible = false;
  lastHit = null;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const movementState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
};

const keyBindings = {
  KeyW: "forward",
  KeyS: "backward",
  KeyA: "left",
  KeyD: "right",
  Space: "up",
  ShiftLeft: "down",
  ShiftRight: "down",
};

window.addEventListener("keydown", (event) => {
  if (event.code in keyBindings) {
    movementState[keyBindings[event.code]] = true;
  }
  if (event.code.startsWith("Digit")) {
    const idx = parseInt(event.code.replace("Digit", ""), 10) - 1;
    if (!Number.isNaN(idx) && idx >= 0 && idx < blockCatalog.length) {
      activeInventoryIndex = idx;
      refreshInventoryUI();
    }
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code in keyBindings) {
    movementState[keyBindings[event.code]] = false;
  }
});

function addBlockAdjacent(hit, type) {
  if (!hit || !hit.face) return;
  const base = hit.object.userData;
  const normal = hit.face.normal.clone();
  const gridX = base.gridX + Math.round(normal.x);
  const gridY = base.gridY + Math.round(normal.y);
  const gridZ = base.gridZ + Math.round(normal.z);
  addBlock(gridX, gridY, gridZ, type);
}

window.addEventListener("mousedown", (event) => {
  if (!controls.isLocked) return;
  if (event.button === 0) {
    if (lastHit) {
      removeBlock(lastHit.object);
    }
  } else if (event.button === 2) {
    event.preventDefault();
    const selected = blockCatalog[activeInventoryIndex];
    if (selected && lastHit) {
      addBlockAdjacent(lastHit, selected.id);
    }
  }
});

window.addEventListener("contextmenu", (event) => {
  if (controls.isLocked) event.preventDefault();
});

function clampPlayerHeight() {
  const player = controls.getObject();
  if (player.position.y < 2) player.position.y = 2;
  if (player.position.y > 60) player.position.y = 60;
}

function updateMovement(delta) {
  const speed = 12;
  const moveForward = movementState.forward - movementState.backward;
  const moveRight = movementState.right - movementState.left;
  const moveVertical = movementState.up - movementState.down;

  if (moveForward !== 0) {
    controls.moveForward(moveForward * speed * delta);
  }
  if (moveRight !== 0) {
    controls.moveRight(moveRight * speed * delta);
  }
  if (moveVertical !== 0) {
    controls.getObject().position.y += moveVertical * speed * delta;
  }
  clampPlayerHeight();
}

function animate() {
  const delta = clock.getDelta();
  if (controls.isLocked) {
    updateMovement(delta);
    updateHighlight();
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
