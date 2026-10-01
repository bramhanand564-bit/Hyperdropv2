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
const controlsRoot = document.querySelector('.right-controls');
const radarPanel = $('#radar-panel');
const radarContent = $('#radar-content');
const radarTitle = $('#radar-title');
const navHint = $('#nav-hint');
const perfHint = $('#perf-hint');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050914);
scene.fog = new THREE.FogExp2(0x07101b, 0.019);

const camera = new THREE.PerspectiveCamera(61, innerWidth / innerHeight, 0.1, 520);
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
  zoneMissionStep: 0,
  basinMissionStep: 0,
  basinRelayCollected: [false, false, false, false],
  basinSecretsCollected: [false, false],
  basinCheckpoint: new THREE.Vector3(0, 0, -170),
  basinChallengeActive: false,
  basinChallengeStart: 0,
  basinChallengeIndex: 0,
  challengeActive: false,
  challengeType: 'signal',
  challengeStart: 0,
  completed: false,
  savedName: 'Explorer',
  activeZone: 'HUB',
  relayCollected: [false, false, false],
  secretsCollected: [false, false, false],
  checkpoint: new THREE.Vector3(-20, 0, -80),
  soundOn: true,
  quality: 'HIGH',
  lastAlertAt: 0,
  actionLockUntil: 0,
  challengeRecords: {
    signal: { clears: 0, bestSeconds: null },
    memory: { clears: 0, bestSeconds: null },
    delivery: { clears: 0, bestSeconds: null },
    basinSprint: { clears: 0, bestSeconds: null }
  }
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
  walkPhase: 0
};

const interactables = [];
const worldProps = [];
const npcs = [];
const challengePads = [];
const beacons = [];
const challengeTargets = [];
const relays = [];
const secrets = [];
const hazards = [];
const basinRelays = [];
const basinSecrets = [];
const basinHazards = [];
const basinChallengeTargets = [];
const basinEventNodes = [];
const streamedDecor = [];
const collisionBoxes = [];
const zoneGroups = {
  HUB: new THREE.Group(),
  OUTPOST: new THREE.Group(),
  BASIN: new THREE.Group()
};
const SAVE_KEY = 'nexus-world-v04-save';
const LEGACY_SAVE_KEYS = ['nexus-world-v03-save'];
const ACTION_COOLDOWN_MS = 280;
let basinEventCycle = -1;

scene.add(zoneGroups.HUB);
scene.add(zoneGroups.OUTPOST);
scene.add(zoneGroups.BASIN);

const avatarStyles = [
  { name: 'AURORA', body: 0xe9f0f9, suit: 0x5e88bd, accent: 0xb8d8ff },
  { name: 'EMBER', body: 0xf0d6c4, suit: 0x9a4f45, accent: 0xffc08a },
  { name: 'VOLT', body: 0xd8e1ee, suit: 0x6b58a6, accent: 0xdec9ff }
];
let avatarStyleIndex = 0;

const palette = {
  ground: 0x121d2b,
  road: 0x0a1018,
  building: 0x1b2a3a,
  building2: 0x23364a,
  glow: 0xa6c7ff,
  beacon: 0xddeaff
};

const zoneVisuals = {
  HUB: { background: 0x050914, fog: 0x07101b, density: 0.019 },
  OUTPOST: { background: 0x0b0812, fog: 0x130c1c, density: 0.022 },
  BASIN: { background: 0x061018, fog: 0x0a1b22, density: 0.017 }
};

const hubBounds = { minX: -35, maxX: 35, minZ: -35, maxZ: 35 };
const outpostBounds = { minX: -39, maxX: 39, minZ: -98, maxZ: -29 };
const basinBounds = { minX: -44, maxX: 44, minZ: -178, maxZ: -105 };

const mat = (color, roughness, metalness, emissive) =>
  new THREE.MeshStandardMaterial({
    color: color,
    roughness: roughness === undefined ? 0.8 : roughness,
    metalness: metalness === undefined ? 0.1 : metalness,
    emissive: emissive || 0x000000,
    emissiveIntensity: emissive ? 1.7 : 0
  });

function mesh(geometry, material, position, parent) {
  const object = new THREE.Mesh(geometry, material);
  object.position.copy(position);
  object.castShadow = false;
  object.receiveShadow = false;
  (parent || scene).add(object);
  return object;
}

function addGlow(position, scale, color, parent) {
  const glow = mesh(
    new THREE.SphereGeometry(0.35 * (scale || 1), 12, 10),
    mat(color || palette.glow, 0.2, 0.4, color || palette.glow),
    position,
    parent || scene
  );
  return glow;
}

function addPillar(x, y, z, height, color, parent) {
  const p = mesh(
    new THREE.CylinderGeometry(0.18, 0.28, height, 8),
    mat(color, 0.35, 0.5, color),
    new THREE.Vector3(x, height / 2 + y, z),
    parent
  );
  addGlow(new THREE.Vector3(x, height + y + 0.18, z), 0.6, color, parent);
  return p;
}

function registerInteractable(object, type, zone, extra) {
  object.userData.type = type;
  object.userData.zone = zone;
  if (extra) Object.assign(object.userData, extra);
  interactables.push(object);
  return object;
}

function addCollisionBox(x, z, halfX, halfZ, zone) {
  collisionBoxes.push({ x: x, z: z, halfX: halfX, halfZ: halfZ, zone: zone });
}

function registerStreamedDecor(object, zone, radius) {
  streamedDecor.push({
    object,
    zone,
    radius: radius || 58,
    baseVisible: object.visible
  });
  return object;
}

function collidesAt(position) {
  const radius = 0.55;
  for (const box of collisionBoxes) {
    if (box.zone !== state.activeZone) continue;
    const nearestX = THREE.MathUtils.clamp(position.x, box.x - box.halfX, box.x + box.halfX);
    const nearestZ = THREE.MathUtils.clamp(position.z, box.z - box.halfZ, box.z + box.halfZ);
    const dx = position.x - nearestX;
    const dz = position.z - nearestZ;
    if ((dx * dx) + (dz * dz) < radius * radius) return true;
  }
  return false;
}

function buildHub() {
  const g = zoneGroups.HUB;

  mesh(new THREE.BoxGeometry(78, 0.5, 78), mat(palette.ground), new THREE.Vector3(0, -0.25, 0), g);

  const grid = new THREE.GridHelper(78, 39, 0x3d5570, 0x243447);
  grid.material.opacity = 0.28;
  grid.material.transparent = true;
  g.add(grid);

  const roads = [
    [0, 0, 78, 8],
    [0, 0, 8, 78],
    [0, -31, 12, 10]
  ];

  // Permanent player home / opening spawn: the first place the player sees.
  const homePad = mesh(
    new THREE.CylinderGeometry(4.6, 5.0, 0.28, 40),
    mat(0x162a3b, 0.42, 0.5, 0x244f70),
    new THREE.Vector3(0, 0.14, 8),
    g
  );
  homePad.userData.label = 'NEXUS HOME';
  const homeRing = mesh(
    new THREE.TorusGeometry(4.0, 0.12, 10, 48),
    mat(0xb9d9ff, 0.18, 0.65, 0x6aa9dc),
    new THREE.Vector3(0, 0.3, 8),
    g
  );
  homeRing.rotation.x = Math.PI / 2;

  for (const [x, z] of [[-3.6, 5], [3.6, 5], [-3.6, 11], [3.6, 11]]) {
    addPillar(x, 0, z, 2.8, 0x5e91bb, g);
  }

  const homeSign = mesh(
    new THREE.BoxGeometry(5.8, 0.9, 0.18),
    mat(0x14283a, 0.3, 0.45, 0x356e94),
    new THREE.Vector3(0, 3.9, 5.0),
    g
  );
  homeSign.userData.label = 'NEXUS HOME';
  addGlow(new THREE.Vector3(0, 3.9, 5.0), 0.5, 0x8bc7ef, g);
  roads.forEach((item) => {
    mesh(
      new THREE.BoxGeometry(item[2], 0.06, item[3]),
      mat(palette.road),
      new THREE.Vector3(item[0], 0.02, item[1]),
      g
    );
  });

  const blocks = [
    [-25, -24, 8, 13, 8], [-12, -26, 6, 18, 6], [18, -25, 9, 11, 9],
    [29, -8, 7, 20, 7], [27, 18, 9, 14, 9], [9, 26, 7, 18, 7],
    [-16, 26, 10, 12, 10], [-29, 10, 7, 16, 7], [-25, -2, 6, 10, 6]
  ];

  blocks.forEach((item, i) => {
    const b = mesh(
      new THREE.BoxGeometry(item[2], item[3], item[4]),
      mat(i % 2 ? palette.building2 : palette.building, 0.72, 0.15),
      new THREE.Vector3(item[0], item[3] / 2, item[1]),
      g
    );
    worldProps.push(b);
    addCollisionBox(item[0], item[1], item[2] / 2 + 0.45, item[4] / 2 + 0.45, 'HUB');
    for (let row = 0; row < Math.max(2, Math.floor(item[3] / 4)); row += 1) {
      const side = row % 2 ? -1 : 1;
      mesh(
        new THREE.BoxGeometry(Math.max(1, item[2] * 0.7), 0.12, 0.12),
        mat(0x6685a8, 0.25, 0.4, 0x40658a),
        new THREE.Vector3(item[0], 1.4 + row * 2.1, item[1] + side * (item[4] / 2 + 0.08)),
        g
      );
    }
  });

  const gateBase = mesh(
    new THREE.BoxGeometry(10, 1.2, 2),
    mat(0x0c1521, 0.5, 0.5),
    new THREE.Vector3(0, 0.6, -31),
    g
  );
  registerInteractable(gateBase, 'world-gate', 'HUB');

  const gateSideA = mesh(
    new THREE.BoxGeometry(0.7, 7.4, 0.8),
    mat(0xa8c9ee, 0.22, 0.6, 0x6d9ad0),
    new THREE.Vector3(-4.7, 3.7, -31),
    g
  );
  const gateSideB = gateSideA.clone();
  gateSideB.position.x = 4.7;
  g.add(gateSideB);

  const arch = mesh(
    new THREE.TorusGeometry(5.2, 0.28, 12, 48, Math.PI),
    mat(0xd6e6ff, 0.2, 0.65, 0x7fa9da),
    new THREE.Vector3(0, 5.2, -31),
    g
  );
  arch.rotation.z = Math.PI;
  addGlow(new THREE.Vector3(0, 5.2, -31), 1.4, 0xa6c7ff, g);

  const gateSign = mesh(
    new THREE.BoxGeometry(6.5, 0.8, 0.16),
    mat(0x19283a, 0.35, 0.45, 0x355d85),
    new THREE.Vector3(0, 7.8, -31),
    g
  );
  gateSign.userData.label = 'LUMEN WILDS';

  const terminal = mesh(
    new THREE.BoxGeometry(1.4, 1.7, 1.1),
    mat(0x1d3043, 0.4, 0.35, 0x567fa6),
    new THREE.Vector3(-7, 0.85, -6),
    g
  );
  registerInteractable(terminal, 'terminal', 'HUB');
  mesh(
    new THREE.BoxGeometry(0.8, 0.08, 0.18),
    mat(0xcfe2ff, 0.18, 0.5, 0x9ec9ff),
    new THREE.Vector3(-7, 1.18, -6.35),
    g
  );

  const padData = [
    { x: 9, z: -3, type: 'signal', label: 'SIGNAL RUN' },
    { x: 14, z: 4, type: 'memory', label: 'MEMORY GRID' },
    { x: 8, z: 12, type: 'delivery', label: 'CORE DELIVERY' }
  ];

  padData.forEach((data, index) => {
    const launchPad = mesh(
      new THREE.CylinderGeometry(2.1, 2.1, 0.22, 36),
      mat(
        index === 0 ? 0x20344b : index === 1 ? 0x263b32 : 0x3a2d48,
        0.35,
        0.45,
        index === 0 ? 0x527ca5 : index === 1 ? 0x4e9a72 : 0x9a68b9
      ),
      new THREE.Vector3(data.x, 0.11, data.z),
      g
    );
    registerInteractable(launchPad, 'challenge-pad', 'HUB', {
      challenge: data.type,
      label: data.label
    });
    challengePads.push(launchPad);
  });

  const npcData = [
    { x: -2, z: -8, name: 'Guide', role: 'WORLD GUIDE' },
    { x: 4, z: -7, name: 'Rival', role: 'CHALLENGER' }
  ];

  npcData.forEach((data, index) => {
    const group = new THREE.Group();
    const npcBody = mesh(
      new THREE.CapsuleGeometry(0.42, 0.9, 6, 10),
      mat(index ? 0xb88fe0 : 0x6fa7d8, 0.6, 0.25),
      new THREE.Vector3(0, 1.25, 0),
      group
    );
    mesh(
      new THREE.SphereGeometry(0.34, 14, 10),
      mat(0xd6dce5, 0.72),
      new THREE.Vector3(0, 2.25, 0),
      group
    );
    mesh(
      new THREE.BoxGeometry(0.5, 0.12, 0.1),
      mat(0x08101b, 0.3, 0.4),
      new THREE.Vector3(0, 2.24, -0.31),
      group
    );
    group.position.set(data.x, 0, data.z);
    registerInteractable(group, 'npc', 'HUB', { name: data.name, role: data.role });
    npcs.push(group);
    g.add(group);
    npcBody.userData.npc = true;
  });

  for (let i = 0; i < 3; i += 1) {
    const angle = (Math.PI * 2 * i) / 3;
    const p = new THREE.Vector3(Math.cos(angle) * 5.4, 0.75, 7 + Math.sin(angle) * 6.1);
    const beacon = mesh(
      new THREE.OctahedronGeometry(0.72),
      mat(palette.beacon, 0.16, 0.55, 0xa8cfff),
      p,
      g
    );
    beacon.userData.active = false;
    beacon.userData.index = i;
    beacon.visible = false;
    beacons.push(beacon);
    addGlow(p.clone().add(new THREE.Vector3(0, 0.65, 0)), 0.9, 0x9cc7ff, g);
  }

  const memoryPoints = [
    new THREE.Vector3(2, 0.08, 7),
    new THREE.Vector3(-4, 0.08, 10),
    new THREE.Vector3(-6, 0.08, 3),
    new THREE.Vector3(3, 0.08, 1)
  ];

  memoryPoints.forEach((p, index) => {
    const marker = mesh(
      new THREE.TorusGeometry(0.65, 0.1, 8, 24),
      mat(0x8de0b7, 0.25, 0.4, 0x4a9f75),
      p.clone(),
      g
    );
    marker.rotation.x = Math.PI / 2;
    marker.visible = false;
    marker.userData.index = index;
    challengeTargets.push(marker);
  });

  const deliveryTarget = new THREE.Vector3(-16, 0.12, -18);
  const deliveryMarker = mesh(
    new THREE.TorusGeometry(1.1, 0.14, 8, 28),
    mat(0xd09aff, 0.22, 0.45, 0x8152aa),
    deliveryTarget.clone(),
    g
  );
  deliveryMarker.rotation.x = Math.PI / 2;
  deliveryMarker.visible = false;
  deliveryMarker.userData.delivery = true;
  challengeTargets.push(deliveryMarker);

  const skylineRings = [12, 16, 20];
  skylineRings.forEach((radius, ringIndex) => {
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const h = 5 + ((i + ringIndex) % 4) * 2.2;
      mesh(
        new THREE.BoxGeometry(1.8, h, 1.8),
        mat(0x142231),
        new THREE.Vector3(x, h / 2, z),
        g
      );
    }
  });
}

function buildOutpost() {
  const g = zoneGroups.OUTPOST;

  mesh(
    new THREE.BoxGeometry(82, 0.5, 70),
    mat(0x161021, 0.78, 0.12),
    new THREE.Vector3(0, -0.25, -64),
    g
  );

  const path = mesh(
    new THREE.BoxGeometry(10, 0.08, 64),
    mat(0x0a0a12, 0.58, 0.3),
    new THREE.Vector3(0, 0.04, -64),
    g
  );
  path.material.emissive.setHex(0x1d1730);
  path.material.emissiveIntensity = 0.65;

  const groveRings = [10, 18, 27, 35];
  groveRings.forEach((radius, ringIndex) => {
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2 + ringIndex * 0.22;
      const x = Math.cos(a) * radius;
      const z = -64 + Math.sin(a) * Math.min(radius * 0.82, 28);
      const h = 3.5 + ((i + ringIndex) % 4) * 1.2;
      const tree = mesh(
        new THREE.ConeGeometry(0.95 + ringIndex * 0.14, h, 6),
        mat(ringIndex % 2 ? 0x243049 : 0x2b2440, 0.6, 0.08, ringIndex % 2 ? 0x15203a : 0x21152f),
        new THREE.Vector3(x, h / 2, z),
        g
      );
      tree.rotation.y = a;
      worldProps.push(tree);
      addCollisionBox(x, z, 1.35, 1.35, 'OUTPOST');
    }
  });

  for (let i = 0; i < 14; i += 1) {
    const a = (i / 14) * Math.PI * 2;
    const x = Math.cos(a) * 37;
    const z = -64 + Math.sin(a) * 30;
    addPillar(x, 0, z, 4 + (i % 3) * 1.6, i % 2 ? 0x8f6bd3 : 0x6ea4d9, g);
  }

  const gate = mesh(
    new THREE.BoxGeometry(9, 1, 2),
    mat(0x191426, 0.45, 0.55, 0x674d91),
    new THREE.Vector3(0, 0.5, -30.5),
    g
  );
  registerInteractable(gate, 'return-gate', 'OUTPOST');

  const shrine = mesh(
    new THREE.CylinderGeometry(2.4, 2.9, 1.0, 6),
    mat(0x6f50a3, 0.35, 0.45, 0x7f57bd),
    new THREE.Vector3(20, 0.5, -48),
    g
  );
  registerInteractable(shrine, 'shrine', 'OUTPOST');
  addGlow(new THREE.Vector3(20, 2.2, -48), 1.3, 0xc6a6ff, g);

  const basinGate = mesh(
    new THREE.BoxGeometry(7.5, 1.0, 2),
    mat(0x18313a, 0.42, 0.55, 0x2b7b84),
    new THREE.Vector3(31, 0.5, -42),
    g
  );
  registerInteractable(basinGate, 'basin-gate', 'OUTPOST');
  const basinGateRing = mesh(
    new THREE.TorusGeometry(2.6, 0.2, 10, 34),
    mat(0x8ee3e5, 0.18, 0.55, 0x4daeb9),
    new THREE.Vector3(31, 3.4, -42),
    g
  );
  basinGateRing.rotation.x = Math.PI / 2;
  addGlow(new THREE.Vector3(31, 2.2, -42), 1.0, 0x66d1d7, g);

  const relayPositions = [
    new THREE.Vector3(-22, 1.0, -54),
    new THREE.Vector3(18, 1.0, -69),
    new THREE.Vector3(-6, 1.0, -87)
  ];

  relayPositions.forEach((p, index) => {
    const relay = mesh(
      new THREE.OctahedronGeometry(0.95),
      mat(0x9fd3ff, 0.2, 0.55, 0x5e8ed5),
      p.clone(),
      g
    );
    registerInteractable(relay, 'relay', 'OUTPOST', { index: index });
    relay.visible = false;
    relays.push(relay);

    mesh(
      new THREE.CylinderGeometry(0.62, 0.85, 0.35, 8),
      mat(0x24253a, 0.4, 0.4),
      new THREE.Vector3(p.x, 0.18, p.z),
      g
    );
    addGlow(p.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.72, 0x83c5ff, g);
  });

  const secretPositions = [
    new THREE.Vector3(-30, 0.62, -76),
    new THREE.Vector3(30, 0.62, -82),
    new THREE.Vector3(12, 0.62, -92)
  ];

  secretPositions.forEach((p, index) => {
    const shard = mesh(
      new THREE.DodecahedronGeometry(0.52),
      mat(0xf0c2ff, 0.18, 0.5, 0xd887ff),
      p.clone(),
      g
    );
    registerInteractable(shard, 'secret', 'OUTPOST', { index: index });
    secrets.push(shard);
    addGlow(p.clone().add(new THREE.Vector3(0, 0.5, 0)), 0.55, 0xf0b9ff, g);
  });

  const checkpoint = mesh(
    new THREE.CylinderGeometry(1.1, 1.25, 0.22, 20),
    mat(0x3b5a56, 0.3, 0.45, 0x4d9f91),
    new THREE.Vector3(-20, 0.11, -80),
    g
  );
  registerInteractable(checkpoint, 'checkpoint', 'OUTPOST');
  addGlow(new THREE.Vector3(-20, 0.7, -80), 0.7, 0x78d9c5, g);

  const hazardPositions = [
    new THREE.Vector3(2, 0.03, -75),
    new THREE.Vector3(27, 0.03, -71)
  ];

  hazardPositions.forEach((p) => {
    const hazard = mesh(
      new THREE.CylinderGeometry(3.2, 3.2, 0.05, 28),
      mat(0x3a163d, 0.26, 0.25, 0xa02975),
      p.clone(),
      g
    );
    hazards.push({ mesh: hazard, pos: new THREE.Vector3(p.x, 0, p.z), radius: 3.2 });
  });

  const npcData = [
    { x: -8, z: -49, name: 'Scout', role: 'ZONE SCOUT' },
    { x: 14, z: -61, name: 'Keeper', role: 'RELAY KEEPER' }
  ];

  npcData.forEach((data, index) => {
    const group = new THREE.Group();
    mesh(
      new THREE.CapsuleGeometry(0.44, 0.95, 6, 10),
      mat(index ? 0xc08cdb : 0x6eb6d6, 0.6, 0.28),
      new THREE.Vector3(0, 1.27, 0),
      group
    );
    mesh(
      new THREE.SphereGeometry(0.35, 14, 10),
      mat(0xdfe5ee, 0.7),
      new THREE.Vector3(0, 2.28, 0),
      group
    );
    mesh(
      new THREE.BoxGeometry(0.52, 0.12, 0.1),
      mat(0x080d16, 0.3, 0.45),
      new THREE.Vector3(0, 2.27, -0.32),
      group
    );
    group.position.set(data.x, 0, data.z);
    registerInteractable(group, 'npc', 'OUTPOST', { name: data.name, role: data.role });
    npcs.push(group);
    g.add(group);
  });

  for (let i = 0; i < 7; i += 1) {
    const x = -32 + i * 10.5;
    const h = 2.8 + (i % 3) * 1.6;
    addPillar(x, 0, -45, h, 0x6b86c6, g);
    addPillar(x, 0, -90, h - 0.5, 0x9a6ec8, g);
  }

  const zoneBeacon = mesh(
    new THREE.RingGeometry(2.4, 2.9, 32),
    mat(0xc3a2ff, 0.22, 0.55, 0x8059c2),
    new THREE.Vector3(0, 0.16, -31.8),
    g
  );
  zoneBeacon.rotation.x = Math.PI / 2;
}

function buildBasin() {
  const g = zoneGroups.BASIN;

  mesh(
    new THREE.BoxGeometry(92, 0.5, 74),
    mat(0x101d24, 0.78, 0.12),
    new THREE.Vector3(0, -0.25, -141.5),
    g
  );

  const river = mesh(
    new THREE.BoxGeometry(9, 0.05, 68),
    mat(0x07151a, 0.35, 0.2, 0x123f49),
    new THREE.Vector3(-16, 0.03, -141.5),
    g
  );
  river.material.emissiveIntensity = 1.1;

  const causeways = [-5, 12, 29];
  causeways.forEach((z, index) => {
    mesh(
      new THREE.BoxGeometry(44, 0.12, 3.2),
      mat(0x1a2a32, 0.58, 0.25, 0x1f4650),
      new THREE.Vector3(6, 0.08, z - 141.5),
      g
    );
    if (index < causeways.length - 1) {
      mesh(
        new THREE.BoxGeometry(2.6, 0.18, 3.8),
        mat(0x335f63, 0.45, 0.35, 0x2f6e70),
        new THREE.Vector3(-16, 0.13, z - 141.5),
        g
      );
    }
  });

  const monoliths = [
    [-34, -168, 8], [-28, -124, 11], [22, -168, 12], [34, -128, 7],
    [-2, -116, 9], [8, -173, 10]
  ];
  monoliths.forEach((item, index) => {
    const h = item[2];
    const pillar = mesh(
      new THREE.CylinderGeometry(1.15, 1.55, h, 6),
      mat(index % 2 ? 0x27414a : 0x22343e, 0.52, 0.22, index % 2 ? 0x16434a : 0x102a34),
      new THREE.Vector3(item[0], h / 2, item[1]),
      g
    );
    pillar.rotation.y = index * 0.31;
    registerStreamedDecor(pillar, 'BASIN', 62);
    addCollisionBox(item[0], item[1], 1.8, 1.8, 'BASIN');
    addGlow(new THREE.Vector3(item[0], h + 0.4, item[1]), 0.55, index % 2 ? 0x79d4d9 : 0x8ab4ff, g);
  });

  const lattice = [
    [-32, -150], [-22, -132], [2, -154], [25, -144], [33, -162], [12, -123], [-5, -174]
  ];
  lattice.forEach((p, index) => {
    const h = 2.6 + (index % 3) * 1.3;
    const tree = mesh(
      new THREE.ConeGeometry(0.7, h, 5),
      mat(0x19343b, 0.55, 0.12, 0x113139),
      new THREE.Vector3(p[0], h / 2, p[1]),
      g
    );
    tree.rotation.y = index * 0.5;
    registerStreamedDecor(tree, 'BASIN', 52);
    addCollisionBox(p[0], p[1], 1.15, 1.15, 'BASIN');
  });

  const entry = mesh(
    new THREE.BoxGeometry(9, 1, 2),
    mat(0x172b34, 0.42, 0.55, 0x2e6e78),
    new THREE.Vector3(0, 0.5, -105.8),
    g
  );
  registerInteractable(entry, 'basin-return-gate', 'BASIN');

  const vault = mesh(
    new THREE.CylinderGeometry(3.3, 3.7, 1.0, 8),
    mat(0x2e6770, 0.34, 0.52, 0x3a9eaa),
    new THREE.Vector3(0, 0.5, -141.5),
    g
  );
  registerInteractable(vault, 'basin-vault', 'BASIN');
  addGlow(new THREE.Vector3(0, 2.0, -141.5), 1.25, 0x7fe1e5, g);

  const relayPositions = [
    new THREE.Vector3(-31, 1.0, -151),
    new THREE.Vector3(-12, 1.0, -171),
    new THREE.Vector3(22, 1.0, -156),
    new THREE.Vector3(28, 1.0, -124)
  ];
  relayPositions.forEach((p, index) => {
    const relay = mesh(
      new THREE.TetrahedronGeometry(1.0, 0),
      mat(0x83d7d9, 0.18, 0.58, 0x3b9ea8),
      p.clone(),
      g
    );
    registerInteractable(relay, 'basin-relay', 'BASIN', { index });
    relay.visible = false;
    basinRelays.push(relay);

    mesh(
      new THREE.CylinderGeometry(0.7, 0.9, 0.28, 8),
      mat(0x203841, 0.45, 0.35),
      new THREE.Vector3(p.x, 0.14, p.z),
      g
    );
    addGlow(p.clone().add(new THREE.Vector3(0, 0.7, 0)), 0.75, 0x6ed8df, g);
  });

  const secretPositions = [
    new THREE.Vector3(-37, 0.62, -139),
    new THREE.Vector3(36, 0.62, -174)
  ];
  secretPositions.forEach((p, index) => {
    const shard = mesh(
      new THREE.IcosahedronGeometry(0.6, 0),
      mat(0xa9e8ff, 0.15, 0.52, 0x4cb6cc),
      p.clone(),
      g
    );
    registerInteractable(shard, 'basin-secret', 'BASIN', { index });
    basinSecrets.push(shard);
    addGlow(p.clone().add(new THREE.Vector3(0, 0.6, 0)), 0.58, 0x76dff0, g);
  });

  const checkpoint = mesh(
    new THREE.CylinderGeometry(1.2, 1.35, 0.22, 20),
    mat(0x2e5e62, 0.3, 0.45, 0x42aab1),
    new THREE.Vector3(-25, 0.11, -163),
    g
  );
  registerInteractable(checkpoint, 'basin-checkpoint', 'BASIN');
  addGlow(new THREE.Vector3(-25, 0.7, -163), 0.7, 0x6ed8df, g);

  const hazardPositions = [
    new THREE.Vector3(-3, 0.03, -152),
    new THREE.Vector3(15, 0.03, -133),
    new THREE.Vector3(31, 0.03, -148)
  ];
  hazardPositions.forEach((p, index) => {
    const hazard = mesh(
      new THREE.CylinderGeometry(3.0, 3.0, 0.05, 28),
      mat(0x102c35, 0.25, 0.3, index % 2 ? 0x3c8592 : 0x2a6b7d),
      p.clone(),
      g
    );
    basinHazards.push({ mesh: hazard, pos: new THREE.Vector3(p.x, 0, p.z), radius: 3.0 });
  });

  const npcData = [
    { x: 5, z: -118, name: 'Archivist', role: 'BASIN KEEPER' },
    { x: -11, z: -146, name: 'Runner', role: 'RESONANCE RUNNER' }
  ];
  npcData.forEach((data, index) => {
    const group = new THREE.Group();
    mesh(
      new THREE.CapsuleGeometry(0.44, 0.96, 6, 10),
      mat(index ? 0x5fb5c4 : 0x809fe0, 0.55, 0.28),
      new THREE.Vector3(0, 1.27, 0),
      group
    );
    mesh(
      new THREE.SphereGeometry(0.35, 14, 10),
      mat(0xdfe8ea, 0.68),
      new THREE.Vector3(0, 2.28, 0),
      group
    );
    mesh(
      new THREE.BoxGeometry(0.52, 0.12, 0.1),
      mat(0x071219, 0.3, 0.45),
      new THREE.Vector3(0, 2.27, -0.32),
      group
    );
    group.position.set(data.x, 0, data.z);
    registerInteractable(group, 'npc', 'BASIN', { name: data.name, role: data.role });
    npcs.push(group);
    g.add(group);
  });

  for (let i = 0; i < 9; i += 1) {
    const x = -40 + i * 10;
    const h = 3.2 + (i % 4) * 1.1;
    addPillar(x, 0, -111, h, i % 2 ? 0x4d9cb0 : 0x6888c9, g);
    addPillar(x, 0, -175, h - 0.4, i % 2 ? 0x668fc8 : 0x4c9ca8, g);
  }

  for (let i = 0; i < 8; i += 1) {
    const x = -34 + i * 9.7;
    mesh(
      new THREE.BoxGeometry(0.45, 0.45, 0.45),
      mat(0x8fdce0, 0.15, 0.4, 0x3a8990),
      new THREE.Vector3(x, 4.5 + (i % 3) * 1.2, -141.5 + Math.sin(i) * 12),
      g
    );
  }

  const gateRing = mesh(
    new THREE.TorusGeometry(3.2, 0.22, 10, 40),
    mat(0x8de3e5, 0.18, 0.55, 0x58b6c1),
    new THREE.Vector3(0, 3.8, -105.8),
    g
  );
  gateRing.rotation.x = Math.PI / 2;

  const sprintPoints = [
    new THREE.Vector3(-9, 0.18, -132),
    new THREE.Vector3(18, 0.18, -150),
    new THREE.Vector3(30, 0.18, -169),
    new THREE.Vector3(-24, 0.18, -159)
  ];
  sprintPoints.forEach((p, index) => {
    const marker = mesh(
      new THREE.TorusGeometry(1.05, 0.12, 8, 28),
      mat(0x8bdfe4, 0.18, 0.45, 0x3ea0aa),
      p.clone(),
      g
    );
    marker.rotation.x = Math.PI / 2;
    marker.visible = false;
    marker.userData.index = index;
    basinChallengeTargets.push(marker);
  });

  const eventPoints = [
    new THREE.Vector3(-29, 0.2, -144), new THREE.Vector3(-16, 0.2, -122),
    new THREE.Vector3(1, 0.2, -162), new THREE.Vector3(19, 0.2, -132),
    new THREE.Vector3(35, 0.2, -151), new THREE.Vector3(21, 0.2, -174),
    new THREE.Vector3(-4, 0.2, -176), new THREE.Vector3(-33, 0.2, -168)
  ];
  eventPoints.forEach((p, index) => {
    const node = mesh(
      new THREE.TorusGeometry(0.42, 0.07, 7, 20),
      mat(0x76dce2, 0.18, 0.35, 0x2d7c84),
      p.clone(),
      g
    );
    node.rotation.x = Math.PI / 2;
    node.userData.index = index;
    registerStreamedDecor(node, 'BASIN', 58);
    basinEventNodes.push(node);
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
  const accent = mesh(
    new THREE.BoxGeometry(0.34, 0.08, 0.12),
    mat(0xb8d8ff, 0.3, 0.5),
    new THREE.Vector3(0, 1.55, -0.43),
    body
  );

  player.group.userData.parts = { la: la, ra: ra, ll: ll, rl: rl, torso: torso, accent: accent };
  player.group.add(body);
  player.group.position.copy(player.pos);
  scene.add(player.group);
}

function applyAvatarStyle() {
  const style = avatarStyles[avatarStyleIndex];
  const parts = player.group.userData.parts;
  if (!parts) return;
  parts.torso.material.color.setHex(style.body);
  parts.la.material.color.setHex(style.suit);
  parts.ra.material.color.setHex(style.suit);
  parts.ll.material.color.setHex(style.suit);
  parts.rl.material.color.setHex(style.suit);
  parts.accent.material.color.setHex(style.accent);
}

function cycleAvatarStyle() {
  avatarStyleIndex = (avatarStyleIndex + 1) % avatarStyles.length;
  applyAvatarStyle();
  addAlert('AVATAR', 'Style changed to ' + avatarStyles[avatarStyleIndex].name + '.');
  beep('ui');
  saveGame();
}

function ensureAudio() {
  if (!state.soundOn) return null;
  try {
    if (!window.nexusAudio) {
      window.nexusAudio = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (window.nexusAudio.state === 'suspended') window.nexusAudio.resume();
    return window.nexusAudio;
  } catch {
    return null;
  }
}

function beep(kind) {
  const audio = ensureAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const values = {
    ui: [520, 0.06],
    ok: [760, 0.11],
    secret: [980, 0.18],
    fail: [180, 0.16]
  };
  const spec = values[kind] || values.ui;
  osc.type = kind === 'fail' ? 'sawtooth' : 'sine';
  osc.frequency.setValueAtTime(spec[0], now);
  if (kind === 'ok') osc.frequency.exponentialRampToValueAtTime(1040, now + 0.11);
  if (kind === 'secret') osc.frequency.exponentialRampToValueAtTime(1480, now + 0.16);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + spec[1]);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + spec[1] + 0.02);
}

function saveGame() {
  const payload = {
    name: state.savedName,
    xp: state.xp,
    credits: state.credits,
    level: state.level,
    missionStep: state.missionStep,
    zoneMissionStep: state.zoneMissionStep,
    basinMissionStep: state.basinMissionStep,
    activeZone: state.activeZone,
    relayCollected: state.relayCollected,
    basinRelayCollected: state.basinRelayCollected,
    basinSecretsCollected: state.basinSecretsCollected,
    basinCheckpoint: {
      x: state.basinCheckpoint.x,
      y: state.basinCheckpoint.y,
      z: state.basinCheckpoint.z
    },
    secretsCollected: state.secretsCollected,
    checkpoint: { x: state.checkpoint.x, y: state.checkpoint.y, z: state.checkpoint.z },
    avatarStyleIndex: avatarStyleIndex,
    soundOn: state.soundOn,
    quality: state.quality,
    challengeRecords: state.challengeRecords
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // Restricted browser storage is optional.
  }
}

function loadGame() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);

    if (!raw) {
      for (const legacyKey of LEGACY_SAVE_KEYS) {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) {
          raw = legacyRaw;
          break;
        }
      }
    }

    if (!raw) return;
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') return;

    state.savedName = String(payload.name || 'Explorer').slice(0, 18);
    state.xp = Number(payload.xp || 0);
    state.credits = Number(payload.credits || 0);
    state.level = Math.max(1, Number(payload.level || 1));
    state.missionStep = THREE.MathUtils.clamp(Number(payload.missionStep || 0), 0, 2);
    state.zoneMissionStep = THREE.MathUtils.clamp(Number(payload.zoneMissionStep || 0), 0, 3);
    state.basinMissionStep = THREE.MathUtils.clamp(Number(payload.basinMissionStep || 0), 0, 3);
    const requestedZone = payload.activeZone;
    state.activeZone = requestedZone === 'BASIN' && state.zoneMissionStep >= 3
      ? 'BASIN'
      : requestedZone === 'OUTPOST' && state.missionStep >= 2
        ? 'OUTPOST'
        : 'HUB';

    if (Array.isArray(payload.relayCollected)) {
      state.relayCollected = [!!payload.relayCollected[0], !!payload.relayCollected[1], !!payload.relayCollected[2]];
    }

    if (Array.isArray(payload.basinRelayCollected)) {
      state.basinRelayCollected = [
        !!payload.basinRelayCollected[0],
        !!payload.basinRelayCollected[1],
        !!payload.basinRelayCollected[2],
        !!payload.basinRelayCollected[3]
      ];
    }

    if (Array.isArray(payload.basinSecretsCollected)) {
      state.basinSecretsCollected = [
        !!payload.basinSecretsCollected[0],
        !!payload.basinSecretsCollected[1]
      ];
    }

    if (Array.isArray(payload.secretsCollected)) {
      state.secretsCollected = [!!payload.secretsCollected[0], !!payload.secretsCollected[1], !!payload.secretsCollected[2]];
    }

    if (payload.checkpoint && Number.isFinite(payload.checkpoint.x) && Number.isFinite(payload.checkpoint.z)) {
      const x = THREE.MathUtils.clamp(Number(payload.checkpoint.x), outpostBounds.minX, outpostBounds.maxX);
      const z = THREE.MathUtils.clamp(Number(payload.checkpoint.z), outpostBounds.minZ, outpostBounds.maxZ);
      state.checkpoint.set(x, 0, z);
    }

    if (payload.basinCheckpoint && Number.isFinite(payload.basinCheckpoint.x) && Number.isFinite(payload.basinCheckpoint.z)) {
      const x = THREE.MathUtils.clamp(Number(payload.basinCheckpoint.x), basinBounds.minX, basinBounds.maxX);
      const z = THREE.MathUtils.clamp(Number(payload.basinCheckpoint.z), basinBounds.minZ, basinBounds.maxZ);
      state.basinCheckpoint.set(x, 0, z);
    }

    avatarStyleIndex = Number.isInteger(payload.avatarStyleIndex)
      ? THREE.MathUtils.clamp(payload.avatarStyleIndex, 0, avatarStyles.length - 1)
      : 0;

    state.soundOn = payload.soundOn !== false;
    state.quality = payload.quality === 'LOW' || payload.quality === 'MEDIUM' ? payload.quality : 'HIGH';

    const recordSource = payload.challengeRecords && typeof payload.challengeRecords === 'object'
      ? payload.challengeRecords
      : {};
    for (const key of ['signal', 'memory', 'delivery', 'basinSprint']) {
      const record = recordSource[key];
      if (!record || typeof record !== 'object') continue;
      state.challengeRecords[key].clears = Math.max(0, Math.floor(Number(record.clears || 0)));
      state.challengeRecords[key].bestSeconds = Number.isFinite(Number(record.bestSeconds))
        ? Math.max(0, Number(record.bestSeconds))
        : null;
    }
    if (state.relayCollected.every(Boolean) && state.zoneMissionStep < 2) {
      state.zoneMissionStep = 2;
    }
    if (state.zoneMissionStep >= 2 && state.activeZone === 'HUB' && state.missionStep < 2) {
      state.zoneMissionStep = 0;
      state.relayCollected = [false, false, false];
    }
    nameInput.value = state.savedName;
  } catch {
    // Invalid or partial saves are ignored safely.
  }
}

function applyQuality() {
  const qualityMap = {
    HIGH: { ratio: 1.5, fog: 0.019, maxDistance: 520 },
    MEDIUM: { ratio: 1.0, fog: 0.024, maxDistance: 360 },
    LOW: { ratio: 0.75, fog: 0.032, maxDistance: 240 }
  };
  const preset = qualityMap[state.quality] || qualityMap.HIGH;
  renderer.setPixelRatio(Math.min(devicePixelRatio, preset.ratio));
  camera.far = preset.maxDistance;
  camera.updateProjectionMatrix();
  scene.fog.density = preset.fog;
  const button = $('#graphics');
  if (button) button.textContent = 'GRAPHICS ' + state.quality;
}

function cycleQuality() {
  const order = ['HIGH', 'MEDIUM', 'LOW'];
  const next = (order.indexOf(state.quality) + 1) % order.length;
  state.quality = order[next];
  applyQuality();
  addAlert('GRAPHICS', 'Mode set to ' + state.quality + '.');
  beep('ui');
  saveGame();
}

function renderRadar() {
  const hubItems = [
    ['SIGNAL', 'Terminal west / challenge network'],
    ['TRIALS', 'Three challenge pads in the east sector'],
    ['GATE', 'Lumen Wilds access at the north road'],
    ['GUIDE', 'World Guide near the signal terminal']
  ];
  const outpostItems = [
    ['SCOUT', 'Start the zone mission in the north-west'],
    ['RELAYS', 'Three offline nodes across the grove'],
    ['SHRINE', 'Repair destination on the east side'],
    ['CHECKPOINT', 'Safe respawn point in the south-west'],
    ['SHARDS', 'Three optional discovery secrets'],
    ['BASIN GATE', 'Second-world gate east of the Shrine']
  ];
  const basinItems = [
    ['ARCHIVIST', 'Basin mission start near the northern approach'],
    ['ANCHORS', 'Four resonance anchors across the basin'],
    ['VAULT', 'Central resonance vault'],
    ['CHECKPOINT', 'Safe respawn point in the west basin'],
    ['SHARDS', 'Two optional basin discoveries'],
    ['RETURN', 'Lift back to Lumen Wilds']
  ];
  const items = state.activeZone === 'HUB' ? hubItems : state.activeZone === 'OUTPOST' ? outpostItems : basinItems;
  const labels = { HUB: 'CENTRAL HUB', OUTPOST: 'LUMEN WILDS', BASIN: 'AETHER BASIN' };
  radarTitle.textContent = labels[state.activeZone] + ' • RADAR';
  radarContent.innerHTML = items.map((item) =>
    '<div class="radar-item"><i></i><div><b>' + item[0] + '</b><span>' + item[1] + '</span></div></div>'
  ).join('');
}

function toggleRadar() {
  const opening = radarPanel.classList.contains('hidden');
  if (opening) renderRadar();
  radarPanel.classList.toggle('hidden');
  if (opening) beep('ui');
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  const button = $('#sound');
  if (button) button.textContent = 'SOUND ' + (state.soundOn ? 'ON' : 'OFF');
  addAlert('AUDIO', state.soundOn ? 'Sound enabled.' : 'Sound muted.');
  if (state.soundOn) beep('ok');
  saveGame();
}

function setZoneVisuals() {
  const visual = zoneVisuals[state.activeZone];
  scene.background.setHex(visual.background);
  scene.fog.color.setHex(visual.fog);
  if (visual.density) scene.fog.density = visual.density;
  const labels = { HUB: 'CENTRAL HUB', OUTPOST: 'LUMEN WILDS', BASIN: 'AETHER BASIN' };
  zoneLabel.textContent = labels[state.activeZone] || 'CENTRAL HUB';
  zoneGroups.HUB.visible = state.activeZone === 'HUB';
  zoneGroups.OUTPOST.visible = state.activeZone === 'OUTPOST';
  zoneGroups.BASIN.visible = state.activeZone === 'BASIN';
}

function updateStatusUI() {
  playerLabel.textContent = state.savedName;
  levelLabel.textContent = 'LEVEL ' + state.level;
  creditsLabel.textContent = 'CR ' + state.credits;
}

function countRelays() {
  return state.relayCollected.filter(Boolean).length;
}

function countSecrets() {
  return state.secretsCollected.filter(Boolean).length;
}

function countBasinRelays() {
  return state.basinRelayCollected.filter(Boolean).length;
}

function countBasinSecrets() {
  return state.basinSecretsCollected.filter(Boolean).length;
}

function getNavigationTarget(nowSeconds) {
  if (state.activeZone === 'HUB') {
    if (state.missionStep === 0) return { label: 'SIGNAL TERMINAL', pos: new THREE.Vector3(-7, 0, -6) };
    if (state.missionStep === 1) {
      if (state.challengeActive) {
        if (state.challengeType === 'signal') {
          const next = beacons.find((beacon) => beacon.visible && !beacon.userData.active);
          if (next) return { label: 'ACTIVE BEACON ' + (next.userData.index + 1), pos: next.position };
        }
        if (state.challengeType === 'memory') {
          const points = [
            new THREE.Vector3(2, 0, 7), new THREE.Vector3(-4, 0, 10),
            new THREE.Vector3(-6, 0, 3), new THREE.Vector3(3, 0, 1)
          ];
          const elapsed = nowSeconds - state.challengeStart;
          return { label: 'GRID NODE ' + (Math.min(3, Math.floor(elapsed / 5)) + 1), pos: points[Math.min(3, Math.floor(elapsed / 5))] };
        }
        return { label: 'DELIVERY GATE', pos: new THREE.Vector3(-16, 0, -18) };
      }
      const pad = challengePads.find((item) => item.userData.challenge === 'signal');
      if (pad) return { label: 'SIGNAL RUN PAD', pos: pad.position };
    }
    return { label: 'LUMEN WILDS GATE', pos: new THREE.Vector3(0, 0, -31) };
  }

  if (state.activeZone === 'OUTPOST') {
    if (state.zoneMissionStep === 0) return { label: 'SCOUT', pos: new THREE.Vector3(-8, 0, -49) };
    if (state.zoneMissionStep === 1) {
      const nextIndex = state.relayCollected.findIndex((value) => !value);
      const target = relays[Math.max(0, nextIndex)];
      if (target) return { label: 'RELAY ' + (Math.max(0, nextIndex) + 1), pos: target.position };
    }
    if (state.zoneMissionStep === 2) return { label: 'LUMEN SHRINE', pos: new THREE.Vector3(20, 0, -48) };
    return { label: 'AETHER BASIN GATE', pos: new THREE.Vector3(31, 0, -42) };
  }

  if (state.basinChallengeActive) {
    const target = basinChallengeTargets[state.basinChallengeIndex];
    if (target) return { label: 'SPRINT GATE ' + (state.basinChallengeIndex + 1), pos: target.position };
  }
  if (state.basinMissionStep === 0) return { label: 'ARCHIVIST', pos: new THREE.Vector3(5, 0, -118) };
  if (state.basinMissionStep === 1) {
    const nextIndex = state.basinRelayCollected.findIndex((value) => !value);
    const target = basinRelays[Math.max(0, nextIndex)];
    if (target) return { label: 'ANCHOR ' + (Math.max(0, nextIndex) + 1), pos: target.position };
  }
  if (state.basinMissionStep === 2) return { label: 'RESONANCE VAULT', pos: new THREE.Vector3(0, 0, -141.5) };
  return { label: 'BASIN RETURN', pos: new THREE.Vector3(0, 0, -105.8) };
}

let perfFrames = 0;
let perfElapsed = 0;
let streamElapsed = 0;

function updateZoneStreaming(dt) {
  streamElapsed += dt;
  if (streamElapsed < 0.25) return;
  streamElapsed = 0;

  for (const entry of streamedDecor) {
    if (entry.zone !== state.activeZone) {
      entry.object.visible = false;
      continue;
    }

    const dx = entry.object.position.x - player.pos.x;
    const dz = entry.object.position.z - player.pos.z;
    const distanceSq = (dx * dx) + (dz * dz);
    entry.object.visible = entry.baseVisible && distanceSq <= entry.radius * entry.radius;
  }
}

function updatePerformanceUI(dt) {
  if (!perfHint || !state.started || state.completed) return;
  perfFrames += 1;
  perfElapsed += dt;
  if (perfElapsed < 0.5) return;

  const fps = Math.round(perfFrames / perfElapsed);
  const calls = renderer.info.render.calls;
  perfHint.textContent = 'PERF • ' + fps + ' FPS • ' + calls + ' CALLS';
  perfFrames = 0;
  perfElapsed = 0;
}

function updateNavigationUI(nowSeconds) {
  if (!navHint || !state.started || state.completed) return;

  const target = getNavigationTarget(nowSeconds);
  if (!target) {
    navHint.textContent = 'NAV • NO OBJECTIVE';
    return;
  }

  const dx = target.pos.x - player.pos.x;
  const dz = target.pos.z - player.pos.z;
  const distance = Math.hypot(dx, dz);

  const angleToTarget = Math.atan2(dx, dz);
  let relative = THREE.MathUtils.euclideanModulo(angleToTarget - player.group.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
  let direction = 'AHEAD';
  if (Math.abs(relative) < 0.45) direction = 'AHEAD';
  else if (relative > 0) direction = Math.abs(relative) > 2.35 ? 'BACK-RIGHT' : 'RIGHT';
  else direction = Math.abs(relative) > 2.35 ? 'BACK-LEFT' : 'LEFT';

  navHint.textContent = 'NAV • ' + target.label + ' • ' + direction + ' • ' + distance.toFixed(1) + 'm';
}

function updateMissionUI() {
  let title = 'FIRST SIGNAL';
  let description = 'Find the signal terminal.';
  let progress = 0;
  let total = 1;

  if (state.activeZone === 'HUB') {
    if (state.missionStep === 0) {
      title = 'FIRST SIGNAL';
      description = 'Find the signal terminal.';
      progress = 0;
      total = 1;
    } else if (state.missionStep === 1) {
      title = 'SIGNAL RUN';
      description = 'Collect the three active signal beacons.';
      progress = countCollected();
      total = 3;
    } else {
      title = 'LUMEN WILDS';
      description = 'Use the Central Gate to enter the new zone.';
      progress = 0;
      total = 1;
    }
  } else if (state.activeZone === 'OUTPOST') {
    if (state.zoneMissionStep === 0) {
      title = 'MEET THE SCOUT';
      description = 'Speak with the Scout to begin the zone mission.';
      progress = 0;
      total = 1;
    } else if (state.zoneMissionStep === 1) {
      title = 'RELAY NETWORK';
      description = 'Activate the three relay nodes.';
      progress = countRelays();
      total = 3;
    } else if (state.zoneMissionStep === 2) {
      title = 'LUMEN SHRINE';
      description = 'Take the repaired relay signal to the Shrine.';
      progress = 0;
      total = 1;
    } else {
      title = 'AETHER BASIN GATE';
      description = 'Use the Basin Gate to enter the second world.';
      progress = 0;
      total = 1;
    }
  } else {
    if (state.basinMissionStep === 0) {
      title = 'MEET THE ARCHIVIST';
      description = 'Speak with the Archivist at the Basin approach.';
      progress = 0;
      total = 1;
    } else if (state.basinMissionStep === 1) {
      title = 'ANCHOR ARRAY';
      description = 'Calibrate the four resonance anchors.';
      progress = countBasinRelays();
      total = 4;
    } else if (state.basinMissionStep === 2) {
      title = 'RESONANCE VAULT';
      description = 'Use the stabilized array at the central vault.';
      progress = 0;
      total = 1;
    } else {
      title = 'BASIN RETURN';
      description = 'Reach the return lift to Lumen Wilds.';
      progress = 0;
      total = 1;
    }
  }

  missionTitle.textContent = title;
  objective.textContent = description;
  progressLabel.textContent = progress + ' / ' + total;
  progressFill.style.width = Math.round((progress / total) * 100) + '%';
}

function addAlert(title, textValue, duration) {
  const el = document.createElement('div');
  el.className = 'alert';

  const strong = document.createElement('b');
  strong.textContent = title;
  const span = document.createElement('span');
  span.textContent = textValue;

  el.appendChild(strong);
  el.appendChild(span);
  alertStack.prepend(el);

  while (alertStack.children.length > 3) alertStack.lastElementChild.remove();
  window.setTimeout(() => {
    if (el.parentNode) el.remove();
  }, duration || 2200);
}

let lastWorldEventText = '';

function setWorldEvent(textValue) {
  if (textValue === lastWorldEventText) return;
  lastWorldEventText = textValue;
  eventPill.textContent = textValue;
}

function grantRewards(xp, credits) {
  state.xp += xp;
  state.credits += credits;

  while (state.xp >= 100) {
    state.xp -= 100;
    state.level += 1;
    addAlert('LEVEL UP', 'Level ' + state.level + ' reached.', 2800);
  }

  updateStatusUI();
  saveGame();
}

function startMission() {
  if (state.missionStep !== 0) return;
  state.missionStep = 1;
  beacons.forEach((beacon) => {
    beacon.visible = true;
    beacon.userData.active = false;
  });
  updateMissionUI();
  addAlert('MISSION ACCEPTED', 'Three signal beacons are now active in the hub.', 3200);
  setWorldEvent('EVENT • SIGNAL RUN AVAILABLE');
  beep('ok');
  saveGame();
}

let lastChallengeUiTick = -1;
let lastBasinSprintUiTick = -1;

function beginChallenge(type) {
  if (state.activeZone !== 'HUB') {
    addAlert('CHALLENGE PAD', 'Challenges are available from the Central Hub.');
    return;
  }

  if (state.challengeActive) {
    addAlert('CHALLENGE BUSY', 'Finish or reset the current challenge first.');
    return;
  }

  state.challengeActive = true;
  state.challengeStart = performance.now() / 1000;
  state.challengeType = type;
  lastChallengeUiTick = -1;

  if (type === 'signal') {
    beacons.forEach((beacon) => {
      beacon.visible = true;
      beacon.userData.active = false;
    });
    setWorldEvent('EVENT • SIGNAL RUN • 42s');
    addAlert('CHALLENGE STARTED', 'Touch the three active beacons in any order before time expires.', 3200);
  } else if (type === 'memory') {
    setWorldEvent('EVENT • MEMORY GRID • 25s');
    addAlert('CHALLENGE STARTED', 'Reach the four illuminated grid points before time expires.', 3200);
  } else {
    setWorldEvent('EVENT • CORE DELIVERY • 35s');
    addAlert('CHALLENGE STARTED', 'Reach the marked delivery gate before time expires.', 3200);
  }

  beep('ui');
}

function countCollectedBeacons() {
  return beacons.filter((beacon) => beacon.userData.active).length;
}

function collectBeacon(beacon) {
  if (!state.challengeActive || beacon.userData.active) return;

  beacon.userData.active = true;
  beacon.visible = false;
  grantRewards(20, 15);
  updateMissionUI();
  addAlert('SIGNAL ACQUIRED', 'Beacon ' + (beacon.userData.index + 1) + ' captured. +20 XP • +15 CR');

  if (countCollectedBeacons() === 3) finishSignalChallenge();
}

function finishSignalChallenge() {
  const elapsed = Math.max(0, (performance.now() / 1000) - state.challengeStart);
  state.challengeActive = false;
  state.challengeStart = 0;
  recordChallengeClear('signal', elapsed);
  if (state.missionStep < 2) state.missionStep = 2;

  grantRewards(60, 120);

  beacons.forEach((beacon) => {
    beacon.visible = false;
    beacon.userData.active = false;
  });
  challengeTargets.forEach((marker) => { marker.visible = false; });

  updateMissionUI();
  setWorldEvent('WORLD STATUS • SIGNAL RUN CLEARED');
  addAlert('CHALLENGE CLEARED', '+60 XP • +120 CR • Central Gate unlocked.', 3200);
  beep('ok');
  saveGame();
}

function failChallenge() {
  state.challengeActive = false;
  state.challengeStart = 0;
  lastChallengeUiTick = -1;
  challengeTargets.forEach((marker) => { marker.visible = false; });
  beacons.forEach((beacon) => {
    beacon.visible = false;
    beacon.userData.active = false;
  });
  setWorldEvent('EVENT • CHALLENGE RESET');
  addAlert('CHALLENGE RESET', 'Time expired. Try again from a challenge pad.', 2800);
  beep('fail');
}

function recordChallengeClear(type, elapsedSeconds) {
  const record = state.challengeRecords[type];
  if (!record) return;
  record.clears += 1;
  if (record.bestSeconds === null || elapsedSeconds < record.bestSeconds) {
    record.bestSeconds = Number(elapsedSeconds.toFixed(2));
    addAlert('NEW RECORD', type.toUpperCase() + ' • ' + record.bestSeconds.toFixed(2) + 's', 2400);
  }
}

function finishGenericChallenge(name, type, xp, credits) {
  const elapsed = Math.max(0, (performance.now() / 1000) - state.challengeStart);
  state.challengeActive = false;
  state.challengeStart = 0;
  challengeTargets.forEach((marker) => { marker.visible = false; });
  recordChallengeClear(type, elapsed);
  grantRewards(xp, credits);
  setWorldEvent('WORLD STATUS • ' + name + ' CLEARED');
  addAlert('CHALLENGE CLEARED', '+' + xp + ' XP • +' + credits + ' CR');
  beep('ok');
  saveGame();
}

function resetChallengeVisuals() {
  challengeTargets.forEach((marker) => { marker.visible = false; });
  beacons.forEach((beacon) => {
    beacon.visible = false;
    beacon.userData.active = false;
  });
}

function npcMessage(npc) {
  if (state.activeZone === 'HUB') {
    if (npc.userData.name === 'Guide') {
      addAlert('WORLD GUIDE', 'The Central Gate responds to mastery. Challenge, explore, then push into the next zone.', 3400);
    } else {
      addAlert('CHALLENGER', 'Speed is one path. The new zone tests observation, timing and discovery.', 3400);
    }
    beep('ui');
    return;
  }

  if (state.activeZone === 'BASIN') {
    if (npc.userData.name === 'Archivist') {
      if (state.basinMissionStep === 0) {
        state.basinMissionStep = 1;
        basinRelays.forEach((relay, index) => {
          relay.visible = !state.basinRelayCollected[index];
        });
        updateMissionUI();
        setWorldEvent('EVENT • ANCHOR ARRAY ACTIVE');
        addAlert('BASIN MISSION', 'Four resonance anchors are offline. Calibrate all four before using the vault.', 3600);
        beep('ok');
        saveGame();
      } else {
        addAlert('ARCHIVIST', 'The vault listens only to a fully stabilized array.', 3000);
      }
      return;
    }
    startBasinSprint();
    return;
  }

  if (npc.userData.name === 'Scout') {
    if (state.zoneMissionStep === 0) {
      state.zoneMissionStep = 1;
      relays.forEach((relay, index) => {
        relay.visible = !state.relayCollected[index];
      });
      updateMissionUI();
      setWorldEvent('EVENT • RELAY NETWORK ACTIVE');
      addAlert('ZONE MISSION', 'Three relay nodes are offline. Activate them to stabilize the Lumen Wilds.', 3600);
      beep('ok');
      saveGame();
    } else {
      addAlert('SCOUT', 'Follow the relay signals. The Shrine is waiting beyond the grove.', 3000);
    }
    return;
  }

  addAlert('RELAY KEEPER', 'The Shrine can only accept the signal after all three relays are active.', 3000);
  beep('ui');
}

function collectRelay(index) {
  if (state.zoneMissionStep !== 1 || state.relayCollected[index]) return;

  state.relayCollected[index] = true;
  const relay = relays[index];
  relay.visible = false;
  grantRewards(30, 20);
  addAlert('RELAY ONLINE', 'Node ' + (index + 1) + ' synchronized. +30 XP • +20 CR');
  updateMissionUI();
  beep('ok');

  if (countRelays() === 3) {
    state.zoneMissionStep = 2;
    setWorldEvent('WORLD STATUS • RELAYS STABLE');
    addAlert('NEXT OBJECTIVE', 'Take the repaired relay signal to the Lumen Shrine.', 3400);
    relays.forEach((item) => { item.visible = false; });
    saveGame();
  }
}

function collectBasinRelay(index) {
  if (state.activeZone !== 'BASIN' || state.basinMissionStep !== 1 || state.basinRelayCollected[index]) return;

  state.basinRelayCollected[index] = true;
  const relay = basinRelays[index];
  relay.visible = false;
  grantRewards(35, 25);
  addAlert('ANCHOR CALIBRATED', 'Anchor ' + (index + 1) + ' stabilized. +35 XP • +25 CR');
  updateMissionUI();
  beep('ok');

  if (countBasinRelays() === 4) {
    state.basinMissionStep = 2;
    setWorldEvent('WORLD STATUS • ARRAY STABLE');
    addAlert('NEXT OBJECTIVE', 'Take the stabilized signal to the central Resonance Vault.', 3400);
    basinRelays.forEach((item) => { item.visible = false; });
    saveGame();
  }
}

function collectBasinSecret(index) {
  if (state.basinSecretsCollected[index]) return;

  state.basinSecretsCollected[index] = true;
  basinSecrets[index].visible = false;
  grantRewards(30, 40);
  addAlert('BASIN DISCOVERY', 'Resonance shard recovered. +30 XP • +40 CR • Secrets ' + countBasinSecrets() + '/2', 3000);
  beep('secret');
  saveGame();
}

function useBasinCheckpoint() {
  state.basinCheckpoint.copy(player.pos);
  state.basinCheckpoint.y = 0;
  addAlert('CHECKPOINT', 'Aether Basin respawn point synchronized.', 2400);
  beep('ok');
  saveGame();
}

function startBasinSprint() {
  if (state.basinMissionStep < 1) {
    addAlert('RUNNER', 'Calibrate the anchor array before taking the Resonance Sprint.', 3000);
    return;
  }
  if (state.basinChallengeActive) {
    addAlert('RESONANCE SPRINT', 'The sprint is already active. Follow the lit route.', 2200);
    return;
  }

  state.basinChallengeActive = true;
  state.basinChallengeStart = performance.now() / 1000;
  state.basinChallengeIndex = 0;
  lastBasinSprintUiTick = -1;
  basinChallengeTargets.forEach((marker, index) => {
    marker.visible = index === 0;
  });
  setWorldEvent('EVENT • RESONANCE SPRINT • 30.0s');
  addAlert('RESONANCE SPRINT', 'Pass through all four resonance gates before time expires.', 3200);
  beep('ok');
}

function finishBasinSprint() {
  const elapsed = Math.max(0, performance.now() / 1000 - state.basinChallengeStart);
  state.basinChallengeActive = false;
  state.basinChallengeStart = 0;
  state.basinChallengeIndex = 0;
  lastBasinSprintUiTick = -1;
  basinChallengeTargets.forEach((marker) => { marker.visible = false; });

  const record = state.challengeRecords.basinSprint;
  record.clears += 1;
  if (record.bestSeconds === null || elapsed < record.bestSeconds) {
    record.bestSeconds = Number(elapsed.toFixed(2));
    addAlert('NEW RECORD', 'RESONANCE SPRINT • ' + record.bestSeconds.toFixed(2) + 's', 2400);
  }

  grantRewards(70, 150);
  setWorldEvent('WORLD STATUS • RESONANCE SPRINT CLEARED');
  addAlert('SPRINT CLEARED', '+70 XP • +150 CR', 2800);
  beep('ok');
  saveGame();
}

function failBasinSprint() {
  state.basinChallengeActive = false;
  state.basinChallengeStart = 0;
  state.basinChallengeIndex = 0;
  lastBasinSprintUiTick = -1;
  basinChallengeTargets.forEach((marker) => { marker.visible = false; });
  setWorldEvent('WORLD • AETHER BASIN');
  addAlert('SPRINT FAILED', 'Time expired. Talk to the Runner to retry.', 2800);
  beep('fail');
}

function updateBasinSprint(nowSeconds) {
  if (!state.basinChallengeActive || state.activeZone !== 'BASIN') return;

  const elapsed = nowSeconds - state.basinChallengeStart;
  const remaining = Math.max(0, 30 - elapsed);
  const index = state.basinChallengeIndex;
  const target = basinChallengeTargets[index];

  const uiTick = Math.floor(remaining * 10);
  if (uiTick !== lastBasinSprintUiTick) {
    lastBasinSprintUiTick = uiTick;
    setWorldEvent('EVENT • RESONANCE SPRINT • ' + remaining.toFixed(1) + 's');
  }

  basinChallengeTargets.forEach((marker, markerIndex) => {
    marker.visible = markerIndex === index;
  });

  if (target && player.pos.distanceTo(target.position) < 2.2) {
    if (index >= basinChallengeTargets.length - 1) {
      finishBasinSprint();
      return;
    }
    state.basinChallengeIndex += 1;
    addAlert('SPRINT NODE', 'Gate ' + (state.basinChallengeIndex) + '/4 reached.', 1600);
    beep('ui');
  }

  if (remaining <= 0) failBasinSprint();
}

function activateBasinVault() {
  if (state.basinMissionStep !== 2) {
    addAlert('VAULT LOCKED', 'Stabilize all four resonance anchors first.');
    return;
  }
  state.basinMissionStep = 3;
  grantRewards(100, 220);
  updateMissionUI();
  setWorldEvent('WORLD STATUS • BASIN STABILIZED');
  addAlert('SECOND WORLD READY', 'The return lift is active. Aether Basin exploration is now open-ended.', 3800);
  beep('ok');
  saveGame();
}

function collectSecret(index) {
  if (state.secretsCollected[index]) return;

  state.secretsCollected[index] = true;
  secrets[index].visible = false;
  grantRewards(25, 35);
  addAlert('SECRET FOUND', 'Lumen shard recovered. +25 XP • +35 CR • Secrets ' + countSecrets() + '/3', 3000);
  beep('secret');
  saveGame();
}

function useCheckpoint() {
  state.checkpoint.copy(player.pos);
  state.checkpoint.y = 0;
  addAlert('CHECKPOINT', 'Respawn point synchronized in the Lumen Wilds.', 2400);
  setWorldEvent('WORLD STATUS • CHECKPOINT ACTIVE');
  beep('ok');
  saveGame();
}

function respawnToCheckpoint(reason) {
  player.pos.copy(state.checkpoint);
  player.velY = 0;
  player.grounded = true;
  player.group.position.copy(player.pos);
  cameraState.pitch = 0.42;
  addAlert('RESPAWN', reason + ' Returned to the active checkpoint.', 2800);
  beep('fail');
}

function activateShrine() {
  if (state.zoneMissionStep !== 2) {
    addAlert('SHRINE LOCKED', 'Restore all three relay nodes first.');
    return;
  }

  state.zoneMissionStep = 3;
  grantRewards(80, 160);
  updateMissionUI();
  setWorldEvent('WORLD STATUS • SHRINE AWAKENED');
  addAlert('ZONE UNLOCKED', 'The Shrine opened the return path. The vertical-slice chain is ready to close.', 3800);
  beep('ok');
  saveGame();
}

function completeVerticalSlice() {
  if (state.zoneMissionStep < 3) {
    addAlert('RETURN GATE', 'The gate is dormant until the Shrine is awakened.');
    return;
  }

  state.challengeActive = false;
  state.completed = true;
  resetChallengeVisuals();
  hud.classList.add('hidden');
  complete.classList.remove('hidden');
  $('#complete-copy').textContent =
    'The first zone mission chain is complete: hub mastery, zone travel, relay restoration, discovery secrets and Shrine progression are now playable.';
  setWorldEvent('VERTICAL SLICE • ZONE CHAIN COMPLETE');
  beep('ok');
}

function transitionToZone(zone) {
  const requested = zone;
  if (requested === 'BASIN' && state.zoneMissionStep < 3) {
    state.activeZone = 'OUTPOST';
  } else if (requested === 'OUTPOST' && state.missionStep < 2) {
    state.activeZone = 'HUB';
  } else if (requested === 'HUB') {
    state.activeZone = 'HUB';
  } else {
    state.activeZone = requested;
  }

  state.challengeActive = false;
  state.actionLockUntil = performance.now() + ACTION_COOLDOWN_MS;
  resetChallengeVisuals();

  if (state.activeZone === 'BASIN') {
    if (state.basinMissionStep > 3) state.basinMissionStep = 3;
    if (state.basinMissionStep === 0) {
      state.basinCheckpoint.set(0, 0, -102.8);
    }
    player.pos.copy(state.basinCheckpoint);
    if (player.pos.z > basinBounds.maxZ || player.pos.z < basinBounds.minZ) {
      player.pos.set(0, 0, -102.8);
      state.basinCheckpoint.set(0, 0, -102.8);
    }
    basinEventCycle = Math.floor(performance.now() / 1000 / 18);
    basinRelays.forEach((relay, index) => {
      relay.visible = state.basinMissionStep === 1 && !state.basinRelayCollected[index];
    });
  } else if (state.activeZone === 'OUTPOST') {
    if (state.zoneMissionStep > 3) state.zoneMissionStep = 3;
    player.pos.set(0, 0, -64);
    if (state.zoneMissionStep === 0) {
      state.checkpoint.set(0, 0, -64);
    }
    relays.forEach((relay, index) => {
      relay.visible = state.zoneMissionStep === 1 && !state.relayCollected[index];
    });
  } else {
    player.pos.set(0, 0, 8);
    beacons.forEach((beacon) => {
      beacon.visible = state.missionStep === 1;
      beacon.userData.active = false;
    });
  }

  player.velY = 0;
  player.grounded = true;
  player.group.position.copy(player.pos);
  cameraState.yaw = state.activeZone === 'OUTPOST'
    ? 0.02
    : state.activeZone === 'BASIN'
      ? 0.82
      : Math.PI;
  cameraState.pitch = state.activeZone === 'HUB' ? 0.26 : 0.42;
  cameraState.distance = state.activeZone === 'HUB' ? 6.8 : 9.4;
  setZoneVisuals();
  updateMissionUI();
  updateStatusUI();

  const labels = { HUB: 'CENTRAL HUB', OUTPOST: 'LUMEN WILDS', BASIN: 'AETHER BASIN' };
  setWorldEvent('WORLD • ' + labels[state.activeZone]);
  addAlert(
    'ZONE TRANSITION',
    state.activeZone === 'BASIN'
      ? 'Entered Aether Basin. The second world is live.'
      : state.activeZone === 'OUTPOST'
        ? 'Entered Lumen Wilds. The zone is live.'
        : 'Returned to the Central Hub.',
    3000
  );
  beep('ok');
  saveGame();
}

function nearestInteractable() {
  let best = null;
  let bestDistance = Infinity;

  for (const object of interactables) {
    if (!object.visible) continue;
    if (object.userData.zone !== state.activeZone) continue;

    const distance = player.pos.distanceTo(object.position);
    if (distance < 2.8 && distance < bestDistance) {
      best = object;
      bestDistance = distance;
    }
  }

  return best;
}

function handleAction() {
  const now = performance.now();
  if (now < state.actionLockUntil) return;
  state.actionLockUntil = now + ACTION_COOLDOWN_MS;

  const target = nearestInteractable();

  if (!target) {
    addAlert('ACTION', 'Move closer to an interactable object.');
    return;
  }

  const type = target.userData.type;

  if (type === 'terminal') {
    if (state.missionStep === 0) startMission();
    else addAlert('TERMINAL', 'The signal network is already active.');
    return;
  }

  if (type === 'npc') {
    npcMessage(target);
    return;
  }

  if (type === 'challenge-pad') {
    beginChallenge(target.userData.challenge);
    return;
  }

  if (type === 'world-gate') {
    if (state.missionStep >= 2) transitionToZone('OUTPOST');
    else addAlert('GATE LOCKED', 'Finish the Signal Run before entering Lumen Wilds.');
    return;
  }

  if (type === 'relay') {
    collectRelay(target.userData.index);
    return;
  }

  if (type === 'secret') {
    collectSecret(target.userData.index);
    return;
  }

  if (type === 'checkpoint') {
    useCheckpoint();
    return;
  }

  if (type === 'shrine') {
    activateShrine();
    return;
  }

  if (type === 'basin-gate') {
    if (state.activeZone === 'OUTPOST') {
      if (state.zoneMissionStep >= 3) transitionToZone('BASIN');
      else addAlert('BASIN GATE LOCKED', 'Awaken the Lumen Shrine before entering the second world.');
    }
    return;
  }

  if (type === 'basin-relay') {
    collectBasinRelay(target.userData.index);
    return;
  }

  if (type === 'basin-secret') {
    collectBasinSecret(target.userData.index);
    return;
  }

  if (type === 'basin-checkpoint') {
    useBasinCheckpoint();
    return;
  }

  if (type === 'basin-vault') {
    activateBasinVault();
    return;
  }

  if (type === 'return-gate') {
    if (state.activeZone === 'OUTPOST') {
      if (state.zoneMissionStep >= 3) completeVerticalSlice();
      else addAlert('RETURN GATE', 'Complete the Lumen Shrine objective first.');
    }
    return;
  }

  if (type === 'basin-return-gate') {
    if (state.activeZone === 'BASIN') {
      if (state.basinMissionStep >= 3) transitionToZone('OUTPOST');
      else addAlert('BASIN RETURN', 'Stabilize the Resonance Vault first.');
    }
  }
}

function setupHudButton(id, label, handler) {
  if ($('#' + id)) return;
  const button = document.createElement('button');
  button.id = id;
  button.textContent = label;
  button.className = 'hud-extra';
  button.addEventListener('pointerdown', handler);
  controlsRoot.appendChild(button);
}

function resetTransientInputState() {
  input.x = 0;
  input.y = 0;
  input.jump = false;
  input.sprint = false;
  cameraState.dragging = false;
  cameraState.x = 0;
  cameraState.y = 0;
  const sprintBtn = $('#sprint');
  if (sprintBtn) sprintBtn.classList.remove('active');
  if (stick) stick.style.transform = 'translate(-50%,-50%)';
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
    stick.style.transform = 'translate(calc(-50% + ' + nx + 'px),calc(-50% + ' + ny + 'px))';
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

  $('#jump').addEventListener('pointerdown', () => {
    input.jump = true;
    ensureAudio();
  });

  const sprintBtn = $('#sprint');
  sprintBtn.addEventListener('pointerdown', () => {
    input.sprint = !input.sprint;
    sprintBtn.classList.toggle('active', input.sprint);
  });

  $('#interact').addEventListener('pointerdown', handleAction);

  setupHudButton('avatar-cycle', 'AVATAR', cycleAvatarStyle);

  $('#map').addEventListener('pointerdown', toggleRadar);
  $('#radar-close').addEventListener('pointerdown', () => radarPanel.classList.add('hidden'));

  setupHudButton('sound', 'SOUND ON', toggleSound);
  setupHudButton('graphics', 'GRAPHICS HIGH', cycleQuality);

  canvas.addEventListener('pointerdown', (event) => {
    if (hud.classList.contains('hidden') || event.clientX < innerWidth * 0.24) return;
    cameraState.dragging = true;
    cameraState.x = event.clientX;
    cameraState.y = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    ensureAudio();
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
  const bounds = state.activeZone === 'OUTPOST'
    ? outpostBounds
    : state.activeZone === 'BASIN'
      ? basinBounds
      : hubBounds;
  const next = player.pos.clone();
  next.x = THREE.MathUtils.clamp(next.x + move.x * speed * dt, bounds.minX, bounds.maxX);
  if (!collidesAt(new THREE.Vector3(next.x, 0, player.pos.z))) player.pos.x = next.x;
  next.z = THREE.MathUtils.clamp(player.pos.z + move.z * speed * dt, bounds.minZ, bounds.maxZ);
  if (!collidesAt(new THREE.Vector3(player.pos.x, 0, next.z))) player.pos.z = next.z;

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

  const p = player.group.userData.parts;
  if (magnitude > 0.01) {
    const targetYaw = Math.atan2(move.x, move.z);
    player.group.rotation.y = THREE.MathUtils.lerp(
      player.group.rotation.y,
      targetYaw,
      Math.min(1, dt * 10)
    );
    player.walkPhase += dt * (input.sprint ? 14 : 9) * magnitude;
  }

  if (magnitude > 0.01) {
    const swing = Math.sin(player.walkPhase) * 0.55;
    p.la.rotation.x = swing;
    p.ra.rotation.x = -swing;
    p.ll.rotation.x = -swing;
    p.rl.rotation.x = swing;
  } else {
    // Simple idle pose so the opening scene feels alive.
    const idle = Math.sin(performance.now() * 0.0022) * 0.045;
    p.la.rotation.x = THREE.MathUtils.lerp(p.la.rotation.x, idle, Math.min(1, dt * 5));
    p.ra.rotation.x = THREE.MathUtils.lerp(p.ra.rotation.x, -idle, Math.min(1, dt * 5));
    p.ll.rotation.x = THREE.MathUtils.lerp(p.ll.rotation.x, -idle * 0.35, Math.min(1, dt * 5));
    p.rl.rotation.x = THREE.MathUtils.lerp(p.rl.rotation.x, idle * 0.35, Math.min(1, dt * 5));
    p.torso.position.y = 1.3 + Math.sin(performance.now() * 0.0022) * 0.018;
  }

  if (state.activeZone === 'OUTPOST') {
    if (player.pos.distanceTo(state.checkpoint) > 1.2) {
      for (const hazard of hazards) {
        if (player.pos.distanceTo(hazard.pos) < hazard.radius) {
          respawnToCheckpoint('Rift contact.');
          break;
        }
      }
    }
  } else if (state.activeZone === 'BASIN') {
    if (player.pos.distanceTo(state.basinCheckpoint) > 1.2) {
      for (const hazard of basinHazards) {
        if (player.pos.distanceTo(hazard.pos) < hazard.radius) {
          player.pos.copy(state.basinCheckpoint);
          player.velY = 0;
          player.grounded = true;
          player.group.position.copy(player.pos);
          state.actionLockUntil = performance.now() + ACTION_COOLDOWN_MS;
          addAlert('BASIN RECOVERY', 'Rift contact. Returned to your Basin checkpoint.', 2600);
          beep('fail');
          break;
        }
      }
    }
  }
}

function updateChallenge(nowSeconds) {
  if (!state.challengeActive || state.activeZone !== 'HUB') return;

  const elapsed = nowSeconds - state.challengeStart;
  const limit = state.challengeType === 'signal' ? 42 : state.challengeType === 'memory' ? 25 : 35;
  const remaining = Math.max(0, limit - elapsed);
  const label = state.challengeType === 'signal'
    ? 'SIGNAL RUN'
    : state.challengeType === 'memory'
      ? 'MEMORY GRID'
      : 'CORE DELIVERY';

  const uiTick = Math.floor(remaining * 10);
  if (uiTick !== lastChallengeUiTick) {
    lastChallengeUiTick = uiTick;
    setWorldEvent('EVENT • ' + label + ' • ' + remaining.toFixed(1) + 's');
  }

  if (state.challengeType === 'signal') {
    for (const beacon of beacons) {
      if (!beacon.visible) continue;
      beacon.rotation.y += 0.02;
      beacon.position.y = 0.75 + Math.sin(nowSeconds * 2.5 + beacon.userData.index) * 0.16;
      if (player.pos.distanceTo(beacon.position) < 1.8) collectBeacon(beacon);
    }
  } else if (state.challengeType === 'memory') {
    const points = [
      new THREE.Vector3(2, 0, 7),
      new THREE.Vector3(-4, 0, 10),
      new THREE.Vector3(-6, 0, 3),
      new THREE.Vector3(3, 0, 1)
    ];
    const targetIndex = Math.min(3, Math.floor(elapsed / 5));
    const target = points[targetIndex];

    challengeTargets.forEach((marker, index) => {
      marker.visible = index === targetIndex;
    });

    if (player.pos.distanceTo(target) < 2) {
      grantRewards(15, 10);
      addAlert('GRID NODE', 'Node ' + (targetIndex + 1) + ' reached. +15 XP • +10 CR');

      if (targetIndex === 3) {
        finishGenericChallenge('MEMORY GRID', 'memory', 45, 90);
      } else {
        state.challengeStart = performance.now() / 1000 - (targetIndex + 1) * 5;
      }
    }
  } else {
    challengeTargets.forEach((marker, index) => {
      marker.visible = index === challengeTargets.length - 1;
    });

    const target = new THREE.Vector3(-16, 0, -18);
    if (player.pos.distanceTo(target) < 2.4) {
      finishGenericChallenge('CORE DELIVERY', 'delivery', 55, 110);
    }
  }

  if (remaining <= 0 && state.challengeActive) failChallenge();
}

function updateWorld(nowSeconds) {
  npcs.forEach((npc, index) => {
    npc.position.y = Math.sin(nowSeconds * 1.4 + index) * 0.025;
    npc.rotation.y = Math.sin(nowSeconds * 0.35 + index) * 0.12;
  });



  relays.forEach((relay, index) => {
    if (!relay.visible) return;
    relay.rotation.y += 0.01 + index * 0.002;
    relay.position.y = 1 + Math.sin(nowSeconds * 2 + index) * 0.16;
  });

  basinRelays.forEach((relay, index) => {
    if (!relay.visible) return;
    relay.rotation.y += 0.014 + index * 0.0015;
    relay.position.y = 1 + Math.sin(nowSeconds * 1.8 + index) * 0.16;
  });

  secrets.forEach((secret, index) => {
    if (!secret.visible) return;
    secret.rotation.y += 0.018;
    secret.position.y = 0.62 + Math.sin(nowSeconds * 2.2 + index) * 0.12;
  });

  basinSecrets.forEach((secret, index) => {
    if (!secret.visible) return;
    secret.rotation.y += 0.022;
    secret.position.y = 0.62 + Math.sin(nowSeconds * 2.0 + index) * 0.12;
  });

  if (state.activeZone === 'BASIN') {
    basinChallengeTargets.forEach((marker, index) => {
      if (!marker.visible) return;
      marker.rotation.z += 0.018;
      marker.position.y = 0.18 + Math.sin(nowSeconds * 2.4 + index) * 0.06;
    });

    const phase = (nowSeconds % 18) / 18;
    basinEventNodes.forEach((node, index) => {
      const wave = Math.max(0, 1 - Math.abs(((phase * 8 + index) % 8) - 4) / 4);
      node.rotation.z += 0.006;
      node.scale.setScalar(1 + wave * 0.35);
      node.material.emissiveIntensity = 0.8 + wave * 2.0;
    });
  }

  if (state.activeZone === 'BASIN' && state.started) {
    const cycle = Math.floor(nowSeconds / 18);
    if (cycle !== basinEventCycle) {
      basinEventCycle = cycle;
      setWorldEvent('WORLD EVENT • RESONANCE SURGE');
      addAlert('WORLD EVENT', 'A resonance surge swept across the Basin. The anchor field is energized.', 2400);
      beep('ui');
    }
  }

  const target = nearestInteractable();
  if (!target) {
    interactionPrompt.classList.add('hidden');
    return;
  }

  const labels = {
    terminal: 'ACTION • SIGNAL TERMINAL',
    'challenge-pad': 'ACTION • START CHALLENGE',
    'world-gate': 'ACTION • ENTER LUMEN WILDS',
    npc: 'ACTION • SPEAK',
    relay: 'ACTION • ACTIVATE RELAY',
    secret: 'ACTION • COLLECT LUMEN SHARD',
    checkpoint: 'ACTION • SET CHECKPOINT',
    shrine: 'ACTION • AWAKEN SHRINE',
    'return-gate': 'ACTION • COMPLETE ZONE CHAIN',
    'basin-gate': 'ACTION • ENTER AETHER BASIN',
    'basin-relay': 'ACTION • CALIBRATE ANCHOR',
    'basin-secret': 'ACTION • COLLECT RESONANCE SHARD',
    'basin-checkpoint': 'ACTION • SET BASIN CHECKPOINT',
    'basin-vault': 'ACTION • STABILIZE VAULT',
    'basin-return-gate': 'ACTION • RETURN TO LUMEN'
  };

  interactionPrompt.textContent = labels[target.userData.type] || 'ACTION';
  interactionPrompt.classList.remove('hidden');
}

function updateCamera(dt) {
  const targetHeight = state.activeZone === 'HUB' ? 1.1 : 1.35;
  const target = player.pos.clone().add(new THREE.Vector3(0, targetHeight, 0));
  const offset = new THREE.Vector3(
    Math.sin(cameraState.yaw) * Math.cos(cameraState.pitch) * cameraState.distance,
    Math.sin(cameraState.pitch) * cameraState.distance,
    Math.cos(cameraState.yaw) * Math.cos(cameraState.pitch) * cameraState.distance
  );

  camera.position.lerp(target.clone().add(offset), Math.min(1, dt * 7));
  camera.lookAt(target);
}

function restoreMissionWorld() {
  resetChallengeVisuals();

  beacons.forEach((beacon) => {
    beacon.visible = state.activeZone === 'HUB' && state.missionStep === 1;
    beacon.userData.active = false;
  });

  relays.forEach((relay, index) => {
    relay.visible = state.activeZone === 'OUTPOST' &&
      state.zoneMissionStep === 1 &&
      !state.relayCollected[index];
  });

  basinRelays.forEach((relay, index) => {
    relay.visible = state.activeZone === 'BASIN' &&
      state.basinMissionStep === 1 &&
      !state.basinRelayCollected[index];
  });

  secrets.forEach((secret, index) => {
    secret.visible = !state.secretsCollected[index];
  });

  basinSecrets.forEach((secret, index) => {
    secret.visible = !state.basinSecretsCollected[index];
  });

  basinChallengeTargets.forEach((marker) => {
    marker.visible = false;
  });
  state.basinChallengeActive = false;
  state.basinChallengeStart = 0;
  state.basinChallengeIndex = 0;
}

function startGame() {
  state.actionLockUntil = 0;
  loadGame();
  state.savedName = (nameInput.value || state.savedName || 'Explorer').trim().slice(0, 18) || 'Explorer';
  state.started = true;
  state.completed = false;
  state.challengeActive = false;

  applyAvatarStyle();
  applyQuality();
  setZoneVisuals();
  restoreMissionWorld();

  if (state.activeZone === 'BASIN') {
    if (state.basinMissionStep === 0) {
      state.basinCheckpoint.set(0, 0, -102.8);
    }
    player.pos.copy(state.basinCheckpoint);
    if (player.pos.z > basinBounds.maxZ || player.pos.z < basinBounds.minZ) {
      player.pos.set(0, 0, -102.8);
      state.basinCheckpoint.set(0, 0, -102.8);
    }
  } else if (state.activeZone === 'OUTPOST') {
    player.pos.copy(state.checkpoint);
    if (player.pos.z > -29 || player.pos.z < -98) player.pos.set(0, 0, -64);
  } else {
    // New sessions always begin at the permanent NEXUS Home pad.
    player.pos.set(0, 0, 8);
    player.group.rotation.y = Math.PI;
    cameraState.yaw = Math.PI;
    cameraState.pitch = 0.26;
    cameraState.distance = 6.8;
  }

  player.group.position.copy(player.pos);
  startScreen.classList.add('hidden');
  hud.classList.remove('hidden');

  updateStatusUI();
  updateMissionUI();

  let message = '';
  if (state.activeZone === 'BASIN') {
    message = state.basinMissionStep === 0
      ? 'Welcome to Aether Basin. Find the Archivist.'
      : state.basinMissionStep === 1
        ? 'Welcome back to Aether Basin. The anchor array is ready.'
        : 'Welcome back to Aether Basin. Continue the resonance mission.';
  } else if (state.activeZone === 'OUTPOST') {
    message = state.zoneMissionStep === 0
      ? 'Welcome to Lumen Wilds. Find the Scout.'
      : 'Welcome back to Lumen Wilds. Your zone mission is ready.';
  } else {
    message = state.missionStep === 0
      ? 'Welcome, ' + state.savedName + '. Explore the hub and locate the signal terminal.'
      : state.missionStep === 1
        ? 'Welcome back, ' + state.savedName + '. The Signal Run is ready.'
        : 'Welcome back, ' + state.savedName + '. The Central Gate is now accessible.';
  }

  addAlert('SYSTEM ONLINE', message, 3400);
  setWorldEvent(
    state.activeZone === 'BASIN'
      ? 'WORLD • AETHER BASIN'
      : state.activeZone === 'OUTPOST'
        ? 'WORLD • LUMEN WILDS'
        : state.missionStep === 1
          ? 'EVENT • SIGNAL RUN AVAILABLE'
          : 'WORLD STATUS • STABLE'
  );
  ensureAudio();
  saveGame();
}

$('#reset-save').addEventListener('click', () => {
  const confirmed = window.confirm('Reset all local NEXUS progress on this device?');
  if (!confirmed) return;
  try {
    localStorage.removeItem(SAVE_KEY);
    for (const legacyKey of LEGACY_SAVE_KEYS) localStorage.removeItem(legacyKey);
  } catch {}
  window.location.reload();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    resetTransientInputState();
    state.actionLockUntil = 0;
  }
});

window.addEventListener('blur', () => {
  resetTransientInputState();
  state.actionLockUntil = 0;
  if (state.started) saveGame();
});

window.addEventListener('pagehide', () => {
  resetTransientInputState();
  state.actionLockUntil = 0;
  if (state.started) saveGame();
});

let startTapLocked = false;

const launchFromStart = (event) => {
  if (event) event.preventDefault();
  if (startTapLocked) return;
  startTapLocked = true;
  window.setTimeout(() => { startTapLocked = false; }, 650);
  startGame();
};

// Mobile WebView friendly: pointer + touch + click, with a short duplicate-tap guard.
startBtn.addEventListener('pointerup', launchFromStart, { passive: false });
startBtn.addEventListener('touchend', launchFromStart, { passive: false });
startBtn.addEventListener('click', launchFromStart);

continueBtn.addEventListener('click', () => {
  complete.classList.add('hidden');
  hud.classList.remove('hidden');
  state.completed = false;
  radarPanel.classList.add('hidden');
  transitionToZone('HUB');
  addAlert('VERTICAL SLICE', 'Returned to the Central Hub. Progress is saved.', 3000);
});

buildHub();
buildOutpost();
buildBasin();
buildPlayer();

// Render the Home lobby before the player presses ENTER WORLD.
// This keeps the first screen a real 3D mobile-game lobby instead of a flat menu.
state.activeZone = 'HUB';
player.pos.set(0, 0, 8);
player.group.position.copy(player.pos);
player.group.rotation.y = 0;
cameraState.yaw = Math.PI;
cameraState.pitch = 0.26;
cameraState.distance = 6.8;
applyAvatarStyle();
setZoneVisuals();
setupControls();
applyQuality();

let last = performance.now();

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.started && !state.completed) updatePlayer(dt);
  updateChallenge(now * 0.001);
  updateBasinSprint(now * 0.001);
  updateNavigationUI(now * 0.001);
  updatePerformanceUI(dt);
  updateZoneStreaming(dt);
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
