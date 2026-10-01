import * as THREE from 'three';

const $ = (s) => document.querySelector(s);

const canvas = $('#game-canvas');
const startScreen = $('#start-screen');
const hud = $('#hud');
const complete = $('#complete');
const nameInput = $('#player-name');
const startBtn = $('#start-btn');
const continueBtn = $('#continue-btn');

const zoneLabel = $('#zone-label');
const playerLabel = $('#player-label');
const levelLabel = $('#level-label');
const creditsLabel = $('#credits-label');
const eventPill = $('#event-pill');
const missionTitle = $('#mission-title');
const objective = $('#objective');
const progressLabel = $('#progress-label');
const progressFill = $('#progress-fill');
const alertStack = $('#alert-stack');
const interactionPrompt = $('#interaction-prompt');
const joystick = $('#joystick');
const stick = $('#stick');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050914);
scene.fog = new THREE.FogExp2(0x07101b, 0.019);

const camera = new THREE.PerspectiveCamera(61, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight(0xc9dcff, 0x131a26, 1.35));
const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(-30, 42, 16);
scene.add(key);

const clock = new THREE.Clock();
const state = {
  started: false,
  xp: 0,
  credits: 0,
  level: 1,
  missionStep: 0,
  challengeActive: false,
  challengeStart: 0,
  challengeTime: 42,
  completed: false,
  lastAlertAt: 0,
  savedName: 'Explorer'
};

const input = { x: 0, y: 0, jump: false, sprint: false };
const cameraState = {
  yaw: 0.68,
  pitch: 0.42,
  distance: 9.4,
  dragging: false,
  x: 0,
  y: 0
};

const player = {
  pos: new THREE.Vector3(0, 0, 12),
  velY: 0,
  grounded: true,
  baseSpeed: 4.6,
  group: new THREE.Group(),
  parts: null,
  walkPhase: 0
};

const interactables = [];
const beacons = [];
const worldProps = [];
const SAVE_KEY = 'nexus-world-v02-save';

const palette = {
  ground: 0x121d2b,
  road: 0x0a1018,
  building: 0x1b2a3a,
  building2: 0x23364a,
  glow: 0xa6c7ff,
  dark: 0x070c13,
  beacon: 0xddeaff
};

const mat = (color, roughness = 0.8, metalness = 0.1, emissive = 0x000000) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity: emissive ? 1.7 : 0
  });

function mesh(geometry, material, position, parent = scene) {
  const object = new THREE.Mesh(geometry, material);
  object.position.copy(position);
  object.castShadow = false;
  object.receiveShadow = false;
  parent.add(object);
  return object;
}

function addGlow(position, scale = 1, color = palette.glow) {
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.35 * scale, 12, 10),
    mat(color, 0.2, 0.4, color)
  );
  glow.position.copy(position);
  scene.add(glow);
  return glow;
}

function buildHub() {
  mesh(new THREE.BoxGeometry(78, 0.5, 78), mat(palette.ground), new THREE.Vector3(0, -0.25, 0));

  const grid = new THREE.GridHelper(78, 39, 0x3d5570, 0x243447);
  grid.material.opacity = 0.28;
  grid.material.transparent = true;
  scene.add(grid);

  const roads = [
    [0, 0, 78, 8],
    [0, 0, 8, 78]
  ];
  roads.forEach(([x, z, w, d]) => {
    mesh(new THREE.BoxGeometry(w, 0.06, d), mat(palette.road), new THREE.Vector3(x, 0.02, z));
  });

  const blocks = [
    [-25, -24, 8, 13, 8], [-12, -26, 6, 18, 6], [18, -25, 9, 11, 9],
    [29, -8, 7, 20, 7], [27, 18, 9, 14, 9], [9, 26, 7, 18, 7],
    [-16, 26, 10, 12, 10], [-29, 10, 7, 16, 7], [-25, -2, 6, 10, 6]
  ];

  blocks.forEach(([x, z, w, h, d], i) => {
    const b = mesh(
      new THREE.BoxGeometry(w, h, d),
      mat(i % 2 ? palette.building2 : palette.building, 0.72, 0.15),
      new THREE.Vector3(x, h / 2, z)
    );
    worldProps.push(b);

    for (let row = 0; row < Math.max(2, Math.floor(h / 4)); row += 1) {
      const side = row % 2 ? -1 : 1;
      mesh(
        new THREE.BoxGeometry(Math.max(1, w * 0.7), 0.12, 0.12),
        mat(0x6685a8, 0.25, 0.4, 0x40658a),
        new THREE.Vector3(x, 1.4 + row * 2.1, z + side * (d / 2 + 0.08))
      );
    }
  });

  const gateBase = mesh(
    new THREE.BoxGeometry(8, 1.2, 2),
    mat(0x0c1521, 0.5, 0.5),
    new THREE.Vector3(0, 0.6, -24)
  );
  gateBase.userData.type = 'world-gate';
  interactables.push(gateBase);

  const arch = mesh(
    new THREE.TorusGeometry(5.2, 0.28, 12, 48, Math.PI),
    mat(0xd6e6ff, 0.2, 0.65, 0x7fa9da),
    new THREE.Vector3(0, 5.2, -24)
  );
  arch.rotation.z = Math.PI;
  addGlow(new THREE.Vector3(0, 5.2, -24), 1.4);

  const terminal = mesh(
    new THREE.BoxGeometry(1.4, 1.7, 1.1),
    mat(0x1d3043, 0.4, 0.35, 0x567fa6),
    new THREE.Vector3(-7, 0.85, -6)
  );
  terminal.userData.type = 'terminal';
  interactables.push(terminal);

  mesh(new THREE.BoxGeometry(0.8, 0.08, 0.18), mat(0xcfe2ff, 0.18, 0.5, 0x9ec9ff), new THREE.Vector3(-7, 1.18, -6.35));

  const launchPad = mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 0.22, 36),
    mat(0x20344b, 0.35, 0.45, 0x527ca5),
    new THREE.Vector3(9, 0.11, -3)
  );
  launchPad.userData.type = 'challenge-pad';
  interactables.push(launchPad);

  for (let i = 0; i < 3; i += 1) {
    const angle = (Math.PI * 2 * i) / 3;
    const p = new THREE.Vector3(Math.cos(angle) * 5.4, 0.75, 7 + Math.sin(angle) * 6.1);
    const beacon = mesh(
      new THREE.OctahedronGeometry(0.72),
      mat(palette.beacon, 0.16, 0.55, 0xa8cfff),
      p
    );
    beacon.userData.active = false;
    beacon.userData.index = i;
    beacon.visible = false;
    beacons.push(beacon);
    addGlow(p.clone().add(new THREE.Vector3(0, 0.65, 0)), 0.9);
  }

  const skylineRings = [12, 16, 20];
  skylineRings.forEach((radius, ringIndex) => {
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const h = 5 + ((i + ringIndex) % 4) * 2.2;
      mesh(new THREE.BoxGeometry(1.8, h, 1.8), mat(0x142231), new THREE.Vector3(x, h / 2, z));
    }
  });
}

function buildPlayer() {
  const body = new THREE.Group();

  const torso = mesh(
    new THREE.CapsuleGeometry(0.46, 0.95, 6, 12),
    mat(0xe9f0f9, 0.64),
    new THREE.Vector3(0, 1.3, 0),
    body
  );

  mesh(
    new THREE.SphereGeometry(0.36, 18, 12),
    mat(0xdce5ee, 0.7),
    new THREE.Vector3(0, 2.27, 0),
    body
  );

  mesh(
    new THREE.BoxGeometry(0.5, 0.14, 0.1),
    mat(0x07111b, 0.3, 0.4),
    new THREE.Vector3(0, 2.26, -0.33),
    body
  );

  const shoulder = mat(0x91b4d9, 0.45, 0.3, 0x284667);
  const leg = mat(0x566c85, 0.7, 0.2);
  const la = mesh(new THREE.BoxGeometry(0.2, 0.82, 0.2), shoulder, new THREE.Vector3(-0.6, 1.36, 0), body);
  const ra = mesh(new THREE.BoxGeometry(0.2, 0.82, 0.2), shoulder, new THREE.Vector3(0.6, 1.36, 0), body);
  const ll = mesh(new THREE.BoxGeometry(0.25, 0.88, 0.25), leg, new THREE.Vector3(-0.2, 0.52, 0), body);
  const rl = mesh(new THREE.BoxGeometry(0.25, 0.88, 0.25), leg, new THREE.Vector3(0.2, 0.52, 0), body);

  player.group.userData.torso = torso;
  player.group.userData.parts = { la, ra, ll, rl };
  player.group.add(body);
  player.group.position.copy(player.pos);
  scene.add(player.group);
}

function saveGame() {
  const payload = {
    name: state.savedName,
    xp: state.xp,
    credits: state.credits,
    level: state.level,
    missionStep: state.missionStep
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') return;
    state.savedName = String(payload.name || 'Explorer').slice(0, 18);
    state.xp = Number(payload.xp || 0);
    state.credits = Number(payload.credits || 0);
    state.level = Number(payload.level || 1);
    state.missionStep = Number(payload.missionStep || 0);
    nameInput.value = state.savedName;
  } catch {
    // Ignore invalid local save data.
  }
}

function updateStatusUI() {
  playerLabel.textContent = state.savedName;
  levelLabel.textContent = `LEVEL ${state.level}`;
  creditsLabel.textContent = `CR ${state.credits}`;
}

function updateMissionUI() {
  const titles = ['FIRST SIGNAL', 'SIGNAL RUN', 'RETURN TO HUB'];
  const descriptions = [
    'Find the signal terminal.',
    'Collect the three active signal beacons.',
    'Return to the central gate.'
  ];
  missionTitle.textContent = titles[Math.min(state.missionStep, 2)];
  objective.textContent = descriptions[Math.min(state.missionStep, 2)];
  const progress = state.missionStep === 0 ? 0 : state.missionStep === 1 ? countCollected() : 4;
  progressLabel.textContent = state.missionStep === 1 ? `${countCollected()} / 3` : `${Math.min(progress, 4)} / 4`;
  progressFill.style.width = `${Math.min(100, (progress / 4) * 100)}%`;
}

function addAlert(title, textValue, duration = 2200) {
  const el = document.createElement('div');
  el.className = 'alert';
  el.innerHTML = `<b>${title}</b><span>${textValue}</span>`;
  alertStack.prepend(el);
  while (alertStack.children.length > 3) alertStack.lastElementChild.remove();
  window.setTimeout(() => el.remove(), duration);
}

function setWorldEvent(textValue) {
  eventPill.textContent = textValue;
}

function startMission() {
  if (state.missionStep !== 0) return;
  state.missionStep = 1;
  state.challengeActive = false;
  beacons.forEach((b) => { b.visible = true; b.userData.active = false; });
  updateMissionUI();
  addAlert('MISSION ACCEPTED', 'Three signal beacons are now active in the hub.');
  setWorldEvent('EVENT • SIGNAL RUN AVAILABLE');
  saveGame();
}

function beginChallenge() {
  if (state.missionStep !== 1 || state.challengeActive) return;
  state.challengeActive = true;
  state.challengeStart = performance.now() / 1000;
  setWorldEvent('EVENT • SIGNAL RUN • 42s');
  addAlert('CHALLENGE STARTED', 'Touch the three active beacons in any order before time expires.', 3200);
}

function countCollected() {
  return beacons.filter((b) => b.userData.active).length;
}

function collectBeacon(beacon) {
  if (!state.challengeActive || beacon.userData.active) return;
  beacon.userData.active = true;
  beacon.visible = false;
  state.xp += 20;
  state.credits += 15;
  updateStatusUI();
  updateMissionUI();
  addAlert('SIGNAL ACQUIRED', `Beacon ${beacon.userData.index + 1} captured. +20 XP • +15 CR`);
  if (countCollected() === 3) finishChallenge();
  saveGame();
}

function finishChallenge() {
  state.challengeActive = false;
  state.missionStep = 2;
  state.xp += 60;
  state.credits += 120;
  if (state.xp >= 100) {
    state.level += 1;
    state.xp -= 100;
    addAlert('LEVEL UP', `Level ${state.level} reached.`, 3000);
  }
  beacons.forEach((b) => { b.visible = false; b.userData.active = false; });
  updateStatusUI();
  updateMissionUI();
  setWorldEvent('WORLD STATUS • SIGNAL RUN CLEARED');
  addAlert('CHALLENGE CLEARED', '+60 XP • +120 CR • Hub access expanded.', 3200);
  saveGame();
}

function failChallenge() {
  state.challengeActive = false;
  beacons.forEach((b) => { b.visible = true; b.userData.active = false; });
  setWorldEvent('EVENT • SIGNAL RUN RESET');
  addAlert('CHALLENGE RESET', 'Time expired. Try again from the launch pad.', 2800);
}

function nearestInteractable() {
  let best = null;
  let bestDistance = Infinity;
  for (const object of interactables) {
    const distance = player.pos.distanceTo(object.position);
    if (distance < 2.8 && distance < bestDistance) {
      best = object;
      bestDistance = distance;
    }
  }
  return best;
}

function handleAction() {
  const target = nearestInteractable();

  if (target?.userData.type === 'terminal') {
    if (state.missionStep === 0) {
      startMission();
    } else {
      addAlert('TERMINAL', 'The signal network is already active.');
    }
    return;
  }

  if (target?.userData.type === 'challenge-pad') {
    if (state.missionStep === 1) beginChallenge();
    else addAlert('CHALLENGE PAD', 'Complete the current mission objective first.');
    return;
  }

  if (target?.userData.type === 'world-gate') {
    if (state.missionStep >= 2) {
      complete.classList.remove('hidden');
      hud.classList.add('hidden');
      state.completed = true;
      $('#complete-copy').textContent = 'V0.2 playable core cleared. This is the first locked foundation for the larger world roadmap.';
    } else {
      addAlert('GATE LOCKED', 'Finish the Signal Run before using the central gate.');
    }
  }
}

function setupControls() {
  const joystickMove = (clientX, clientY) => {
    const rect = joystick.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const max = rect.width * 0.34;
    const length = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, max / length);
    const nx = dx * scale;
    const ny = dy * scale;
    stick.style.transform = `translate(calc(-50% + ${nx}px),calc(-50% + ${ny}px))`;
    input.x = nx / max;
    input.y = ny / max;
  };

  joystick.addEventListener('pointerdown', (event) => {
    joystick.setPointerCapture(event.pointerId);
    joystickMove(event.clientX, event.clientY);
  });

  joystick.addEventListener('pointermove', (event) => {
    if (joystick.hasPointerCapture(event.pointerId)) joystickMove(event.clientX, event.clientY);
  });

  ['pointerup', 'pointercancel'].forEach((eventName) => {
    joystick.addEventListener(eventName, () => {
      input.x = 0;
      input.y = 0;
      stick.style.transform = 'translate(-50%,-50%)';
    });
  });

  $('#jump').addEventListener('pointerdown', () => { input.jump = true; });
  const sprintBtn = $('#sprint');
  sprintBtn.addEventListener('pointerdown', () => {
    input.sprint = !input.sprint;
    sprintBtn.classList.toggle('active', input.sprint);
  });

  $('#interact').addEventListener('pointerdown', handleAction);
  $('#map').addEventListener('pointerdown', () => {
    addAlert('RADAR', 'Current zone: Central Hub. Main signal terminal is west; challenge pad is east.', 3000);
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (hud.classList.contains('hidden') || event.clientX < innerWidth * 0.24) return;
    cameraState.dragging = true;
    cameraState.x = event.clientX;
    cameraState.y = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!cameraState.dragging) return;
    cameraState.yaw -= (event.clientX - cameraState.x) * 0.0075;
    cameraState.pitch = THREE.MathUtils.clamp(
      cameraState.pitch + (event.clientY - cameraState.y) * 0.0047,
      0.16,
      1.05
    );
    cameraState.x = event.clientX;
    cameraState.y = event.clientY;
  });

  ['pointerup', 'pointercancel'].forEach((name) => {
    canvas.addEventListener(name, () => { cameraState.dragging = false; });
  });
}

function updatePlayer(dt) {
  const forward = new THREE.Vector3(Math.sin(cameraState.yaw), 0, Math.cos(cameraState.yaw));
  const right = new THREE.Vector3(Math.cos(cameraState.yaw), 0, -Math.sin(cameraState.yaw));
  const move = new THREE.Vector3()
    .addScaledVector(forward, -input.y)
    .addScaledVector(right, input.x);

  const magnitude = Math.min(1, move.length());
  if (magnitude > 0.01) move.normalize();

  const speed = player.baseSpeed * (input.sprint ? 1.6 : 1) * magnitude;
  player.pos.x = THREE.MathUtils.clamp(player.pos.x + move.x * speed * dt, -35, 35);
  player.pos.z = THREE.MathUtils.clamp(player.pos.z + move.z * speed * dt, -35, 35);

  if (input.jump && player.grounded) {
    player.velY = 7.0;
    player.grounded = false;
  }
  input.jump = false;

  player.velY -= 19 * dt;
  player.pos.y += player.velY * dt;

  if (player.pos.y <= 0) {
    player.pos.y = 0;
    player.velY = 0;
    player.grounded = true;
  }

  player.group.position.copy(player.pos);

  if (magnitude > 0.01) {
    const targetYaw = Math.atan2(move.x, move.z);
    player.group.rotation.y = THREE.MathUtils.lerp(
      player.group.rotation.y,
      targetYaw,
      Math.min(1, dt * 10)
    );
    player.walkPhase += dt * (input.sprint ? 14 : 9) * magnitude;
  }

  const swing = Math.sin(player.walkPhase) * 0.55;
  const p = player.group.userData.parts;
  p.la.rotation.x = swing;
  p.ra.rotation.x = -swing;
  p.ll.rotation.x = -swing;
  p.rl.rotation.x = swing;
}

function updateChallenge(nowSeconds) {
  if (!state.challengeActive) return;

  const elapsed = nowSeconds - state.challengeStart;
  const remaining = Math.max(0, state.challengeTime - elapsed);
  setWorldEvent(`EVENT • SIGNAL RUN • ${remaining.toFixed(1)}s`);

  for (const beacon of beacons) {
    if (!beacon.visible) continue;
    beacon.rotation.y += 0.02;
    beacon.position.y = 0.75 + Math.sin(nowSeconds * 2.5 + beacon.userData.index) * 0.16;

    if (player.pos.distanceTo(beacon.position) < 1.8) {
      collectBeacon(beacon);
    }
  }

  if (remaining <= 0 && state.challengeActive) failChallenge();
}

function updateWorld(nowSeconds) {
  worldProps.forEach((object, index) => {
    if (index % 3 === 0) object.position.y += Math.sin(nowSeconds * 0.6 + index) * 0.0007;
  });

  const target = nearestInteractable();
  if (!target) {
    interactionPrompt.classList.add('hidden');
  } else {
    const labels = {
      terminal: 'ACTION • SIGNAL TERMINAL',
      'challenge-pad': 'ACTION • START CHALLENGE',
      'world-gate': 'ACTION • CENTRAL GATE'
    };
    interactionPrompt.textContent = labels[target.userData.type] || 'ACTION';
    interactionPrompt.classList.remove('hidden');
  }
}

function updateCamera(dt) {
  const target = player.pos.clone().add(new THREE.Vector3(0, 1.35, 0));
  const offset = new THREE.Vector3(
    Math.sin(cameraState.yaw) * Math.cos(cameraState.pitch) * cameraState.distance,
    Math.sin(cameraState.pitch) * cameraState.distance,
    Math.cos(cameraState.yaw) * Math.cos(cameraState.pitch) * cameraState.distance
  );
  camera.position.lerp(target.clone().add(offset), Math.min(1, dt * 7));
  camera.lookAt(target);
}

function startGame() {
  loadGame();
  state.savedName = (nameInput.value || state.savedName || 'Explorer').trim().slice(0, 18) || 'Explorer';
  state.started = true;
  state.completed = false;
  player.pos.set(0, 0, 12);
  player.group.position.copy(player.pos);
  startScreen.classList.add('hidden');
  hud.classList.remove('hidden');

  zoneLabel.textContent = 'CENTRAL HUB';
  updateStatusUI();
  updateMissionUI();
  addAlert('SYSTEM ONLINE', `Welcome, ${state.savedName}. Explore the hub and locate the signal terminal.`, 3200);
  setWorldEvent('WORLD STATUS • STABLE');
}

startBtn.addEventListener('click', startGame);
continueBtn.addEventListener('click', () => {
  complete.classList.add('hidden');
  hud.classList.remove('hidden');
  state.completed = false;
  addAlert('CORE BUILD', 'Returned to the Central Hub.');
});

buildHub();
buildPlayer();
setupControls();

let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.started && !state.completed) updatePlayer(dt);
  updateChallenge(now * 0.001);
  updateWorld(now * 0.001);
  updateCamera(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
});
