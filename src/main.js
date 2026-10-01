import * as THREE from 'three';

const canvas = document.querySelector('#game-canvas');
const bootScreen = document.querySelector('#boot-screen');
const startButton = document.querySelector('#start-button');
const nameInput = document.querySelector('#player-name');
const hud = document.querySelector('#hud');
const hudName = document.querySelector('#hud-name');
const hudXp = document.querySelector('#hud-xp');
const mapDot = document.querySelector('#map-dot');
const prompt = document.querySelector('#interaction-prompt');
const toast = document.querySelector('#toast');
const joystick = document.querySelector('#joystick');
const knob = document.querySelector('#joystick-knob');
const jumpButton = document.querySelector('#jump-button');
const sprintButton = document.querySelector('#sprint-button');
const interactButton = document.querySelector('#interact-button');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x091322);
scene.fog = new THREE.FogExp2(0x091322, 0.018);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
camera.position.set(7, 5, 9);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x263246, 1.35));
const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(-35, 45, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
scene.add(sun);

const clockState = { last: performance.now() };
const input = { x: 0, y: 0, sprint: false, jumpQueued: false };
const cameraState = { yaw: 0.65, pitch: 0.45, distance: 8.5, dragging: false, lastX: 0, lastY: 0 };
const saveKey = 'nax-world-foundation-v1';

const player = {
  group: new THREE.Group(),
  velocityY: 0,
  grounded: true,
  xp: 0,
  position: new THREE.Vector3(0, 0, 8),
  spawn: new THREE.Vector3(0, 0, 8),
  speed: 4.6,
  sprintMultiplier: 1.8,
  walkCycle: 0,
};

const interactables = [];
const obstacles = [];

function material(color, roughness = 0.78, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addMesh(geometry, mat, position, parent = scene, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.copy(position);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

function buildPlayer() {
  const body = new THREE.Group();
  const torso = addMesh(new THREE.BoxGeometry(0.85, 1.25, 0.55), material(0xeff4fb, .65), new THREE.Vector3(0, 1.45, 0), body);
  torso.scale.y = 1.05;
  addMesh(new THREE.SphereGeometry(0.38, 18, 14), material(0xe6edf5, .7), new THREE.Vector3(0, 2.35, 0), body);

  const visor = addMesh(new THREE.BoxGeometry(0.45, 0.15, 0.10), material(0x0a1523, .35, .15), new THREE.Vector3(0, 2.35, -0.34), body);
  visor.castShadow = false;

  const armMat = material(0xb9c4d3, .78);
  const legMat = material(0x7f8da2, .9);
  const leftArm = addMesh(new THREE.BoxGeometry(0.22, .85, .22), armMat, new THREE.Vector3(-0.62, 1.45, 0), body);
  const rightArm = addMesh(new THREE.BoxGeometry(0.22, .85, .22), armMat, new THREE.Vector3(0.62, 1.45, 0), body);
  const leftLeg = addMesh(new THREE.BoxGeometry(0.27, .9, .28), legMat, new THREE.Vector3(-0.22, 0.55, 0), body);
  const rightLeg = addMesh(new THREE.BoxGeometry(0.27, .9, .28), legMat, new THREE.Vector3(0.22, 0.55, 0), body);

  player.group.add(body);
  player.group.userData.parts = { leftArm, rightArm, leftLeg, rightLeg, body };
  player.group.position.copy(player.position);
  scene.add(player.group);
}

function buildWorld() {
  const ground = addMesh(
    new THREE.PlaneGeometry(240, 240, 1, 1),
    material(0x253443, 1),
    new THREE.Vector3(0, 0, 0)
  );
  ground.rotation.x = -Math.PI / 2;

  const grid = new THREE.GridHelper(240, 60, 0x3d5266, 0x2a3b4c);
  grid.position.y = 0.008;
  grid.material.opacity = .23;
  grid.material.transparent = true;
  scene.add(grid);

  const roadMat = material(0x121c28, .92);
  addMesh(new THREE.BoxGeometry(18, .04, 112), roadMat, new THREE.Vector3(0, .02, -8), scene, false, true);
  addMesh(new THREE.BoxGeometry(112, .04, 18), roadMat, new THREE.Vector3(0, .025, -8), scene, false, true);

  for (let i = 0; i < 10; i++) {
    const size = 3 + (i % 3);
    const h = 4 + (i % 4) * 2;
    const x = i < 5 ? -17 - (i % 2) * 7 : 17 + (i % 2) * 7;
    const z = -38 + i * 8;
    const building = addMesh(new THREE.BoxGeometry(size, h, size), material(0x33465b + (i % 2) * 0x111111, .82), new THREE.Vector3(x, h / 2, z));
    obstacles.push({ x, z, radius: size * .8 });
    const roof = addMesh(new THREE.BoxGeometry(size + .15, .18, size + .15), material(0x1b2634, .72), new THREE.Vector3(x, h + .08, z), building.parent);
    roof.position.y = h + .08;
  }

  for (let i = 0; i < 18; i++) {
    const x = (i % 2 === 0 ? -1 : 1) * (24 + (i % 4) * 5);
    const z = -45 + i * 5.5;
    const trunk = addMesh(new THREE.CylinderGeometry(.22, .3, 1.8, 8), material(0x5b4635), new THREE.Vector3(x, .9, z));
    const crown = addMesh(new THREE.SphereGeometry(1.15 + (i % 3) * .18, 12, 10), material(0x587b61, .95), new THREE.Vector3(x, 2.35, z));
    crown.castShadow = true;
  }

  const plaza = addMesh(new THREE.CylinderGeometry(5.5, 5.5, .18, 48), material(0x3a4f64, .62), new THREE.Vector3(0, .09, -7), scene, false, true);
  const core = new THREE.Mesh(new THREE.TorusGeometry(3.2, .10, 8, 48), material(0x91b6d9, .4, .4));
  core.rotation.x = Math.PI / 2;
  core.position.set(0, .2, -7);
  core.castShadow = false;
  scene.add(core);

  const beacon = addMesh(new THREE.CylinderGeometry(.7, .9, 3.8, 16), material(0x8798ad, .42, .55), new THREE.Vector3(0, 2, -7));
  beacon.userData.interactable = true;
  beacon.userData.label = 'NAX Beacon';
  interactables.push(beacon);

  const orb = addMesh(new THREE.SphereGeometry(.55, 20, 16), material(0xdce9ff, .2, .75), new THREE.Vector3(0, 4.25, -7));
  orb.userData.interactable = true;
  orb.userData.label = 'World Core';
  interactables.push(orb);

  for (let i = 0; i < 5; i++) {
    const pad = addMesh(new THREE.CylinderGeometry(.9, .9, .12, 20), material(0x526c83, .6, .05), new THREE.Vector3(-8 + i * 4, .06, 3));
    pad.userData.interactable = true;
    pad.userData.label = 'Discovery Pad';
    interactables.push(pad);
  }
}

function queueJump() { input.jumpQueued = true; }
function setJoystick(clientX, clientY, pointerId) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const max = rect.width * .34;
  const len = Math.hypot(dx, dy) || 1;
  const scale = Math.min(1, max / len);
  const nx = dx * scale;
  const ny = dy * scale;
  knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
  input.x = nx / max;
  input.y = ny / max;
  joystick.dataset.pointer = String(pointerId);
}
function resetJoystick() {
  input.x = 0; input.y = 0; delete joystick.dataset.pointer;
  knob.style.transform = 'translate(-50%, -50%)';
}
joystick.addEventListener('pointerdown', e => {
  joystick.setPointerCapture(e.pointerId);
  setJoystick(e.clientX, e.clientY, e.pointerId);
});
joystick.addEventListener('pointermove', e => {
  if (joystick.dataset.pointer === String(e.pointerId)) setJoystick(e.clientX, e.clientY, e.pointerId);
});
joystick.addEventListener('pointerup', resetJoystick);
joystick.addEventListener('pointercancel', resetJoystick);
jumpButton.addEventListener('pointerdown', e => { e.preventDefault(); queueJump(); });
sprintButton.addEventListener('pointerdown', e => { e.preventDefault(); input.sprint = true; });
sprintButton.addEventListener('pointerup', () => { input.sprint = false; });
sprintButton.addEventListener('pointercancel', () => { input.sprint = false; });
interactButton.addEventListener('pointerdown', e => { e.preventDefault(); interact(); });

canvas.addEventListener('pointerdown', e => {
  if (!hud.classList.contains('hidden') && e.clientX > innerWidth * .25) {
    cameraState.dragging = true; cameraState.lastX = e.clientX; cameraState.lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointermove', e => {
  if (!cameraState.dragging) return;
  const dx = e.clientX - cameraState.lastX;
  const dy = e.clientY - cameraState.lastY;
  cameraState.lastX = e.clientX; cameraState.lastY = e.clientY;
  cameraState.yaw -= dx * .008;
  cameraState.pitch = THREE.MathUtils.clamp(cameraState.pitch + dy * .005, .12, 1.05);
});
canvas.addEventListener('pointerup', () => { cameraState.dragging = false; });
canvas.addEventListener('pointercancel', () => { cameraState.dragging = false; });

function worldDirection() {
  const forward = new THREE.Vector3(Math.sin(cameraState.yaw), 0, Math.cos(cameraState.yaw));
  const right = new THREE.Vector3(Math.cos(cameraState.yaw), 0, -Math.sin(cameraState.yaw));
  return { forward, right };
}

function circleCollision(nextX, nextZ) {
  const radius = .62;
  for (const o of obstacles) {
    const dx = nextX - o.x, dz = nextZ - o.z;
    const distance = Math.hypot(dx, dz);
    if (distance < o.radius + radius) return true;
  }
  return false;
}

function updatePlayer(dt) {
  const { forward, right } = worldDirection();
  const move = new THREE.Vector3()
    .addScaledVector(forward, -input.y)
    .addScaledVector(right, input.x);
  const magnitude = Math.min(1, move.length());
  if (magnitude > .01) move.normalize();

  const speed = player.speed * (input.sprint ? player.sprintMultiplier : 1) * magnitude;
  const nextX = player.position.x + move.x * speed * dt;
  const nextZ = player.position.z + move.z * speed * dt;
  if (!circleCollision(nextX, player.position.z)) player.position.x = nextX;
  if (!circleCollision(player.position.x, nextZ)) player.position.z = nextZ;

  if (input.jumpQueued && player.grounded) {
    player.velocityY = 7.1;
    player.grounded = false;
  }
  input.jumpQueued = false;

  player.velocityY -= 17 * dt;
  player.position.y += player.velocityY * dt;
  if (player.position.y <= 0) {
    player.position.y = 0; player.velocityY = 0; player.grounded = true;
  }

  player.group.position.copy(player.position);
  if (magnitude > .01) {
    const targetYaw = Math.atan2(move.x, move.z);
    player.group.rotation.y = THREE.MathUtils.lerpAngle(player.group.rotation.y, targetYaw, Math.min(1, dt * 12));
    player.walkCycle += dt * (input.sprint ? 13 : 9) * magnitude;
  } else {
    player.walkCycle += dt * 2;
  }
  const parts = player.group.userData.parts;
  const swing = magnitude > .01 ? Math.sin(player.walkCycle) * .52 : Math.sin(player.walkCycle) * .04;
  parts.leftArm.rotation.x = swing;
  parts.rightArm.rotation.x = -swing;
  parts.leftLeg.rotation.x = -swing;
  parts.rightLeg.rotation.x = swing;
}

function updateCamera(dt) {
  const target = player.position.clone().add(new THREE.Vector3(0, 1.25, 0));
  const offset = new THREE.Vector3(
    Math.sin(cameraState.yaw) * Math.cos(cameraState.pitch) * cameraState.distance,
    Math.sin(cameraState.pitch) * cameraState.distance,
    Math.cos(cameraState.yaw) * Math.cos(cameraState.pitch) * cameraState.distance
  );
  const desired = target.clone().add(offset);
  camera.position.lerp(desired, Math.min(1, dt * 7));
  camera.lookAt(target);
}

function updateMiniMap() {
  const x = THREE.MathUtils.clamp(player.position.x / 60, -1, 1);
  const z = THREE.MathUtils.clamp(player.position.z / 60, -1, 1);
  mapDot.style.left = `${50 + x * 42}%`;
  mapDot.style.top = `${50 + z * 42}%`;
}

function nearestInteractable() {
  let closest = null; let distance = Infinity;
  for (const obj of interactables) {
    const d = obj.position.distanceTo(player.position);
    if (d < distance) { distance = d; closest = obj; }
  }
  return distance < 4.2 ? closest : null;
}

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 1800);
}

function interact() {
  const target = nearestInteractable();
  if (!target) {
    showToast('Move closer to a discovery point.');
    return;
  }
  player.xp += 10;
  hudXp.textContent = String(player.xp);
  target.rotation.y += Math.PI / 4;
  showToast(`${target.userData.label} discovered • +10 XP`);
  saveState();
}

function refreshPrompt() {
  const target = nearestInteractable();
  if (!target) prompt.classList.add('hidden');
  else {
    prompt.textContent = `TAP INTERACT • ${target.userData.label}`;
    prompt.classList.remove('hidden');
  }
}

function saveState() {
  localStorage.setItem(saveKey, JSON.stringify({
    name: hudName.textContent || 'Explorer',
    xp: player.xp,
    x: player.position.x, z: player.position.z
  }));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) || 'null');
    if (!saved) return;
    if (saved.name) {
      nameInput.value = saved.name;
      hudName.textContent = saved.name;
    }
    if (Number.isFinite(saved.x)) player.position.x = THREE.MathUtils.clamp(saved.x, -55, 55);
    if (Number.isFinite(saved.z)) player.position.z = THREE.MathUtils.clamp(saved.z, -55, 55);
    player.xp = Number(saved.xp) || 0;
    hudXp.textContent = String(player.xp);
  } catch {
    localStorage.removeItem(saveKey);
  }
}

function startGame() {
  const name = (nameInput.value || 'Explorer').trim().slice(0, 18) || 'Explorer';
  hudName.textContent = name;
  loadState();
  hudName.textContent = nameInput.value.trim() || name;
  saveState();
  bootScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  showToast('NAX World loaded • explore the zone');
}

startButton.addEventListener('click', startGame);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });

buildWorld();
buildPlayer();
loadState();
player.group.position.copy(player.position);

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(.05, Math.max(.001, (now - clockState.last) / 1000));
  clockState.last = now;

  updatePlayer(dt);
  updateCamera(dt);
  refreshPrompt();
  updateMiniMap();

  const t = now * .001;
  scene.traverse(obj => {
    if (obj.userData.interactable && obj.geometry?.type === 'SphereGeometry') {
      obj.position.y = 4.25 + Math.sin(t * 1.8) * .17;
    }
  });

  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') saveState();
});
