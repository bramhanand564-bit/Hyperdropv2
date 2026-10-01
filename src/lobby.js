import * as THREE from 'three';

export function buildLobbyExperience(scene, hub, playerGroup) {
  const animated = [];
  const add = (geometry, material, position, parent = hub) => {
    const o = new THREE.Mesh(geometry, material);
    o.position.copy(position);
    parent.add(o);
    return o;
  };
  const material = (color, emissive = 0x000000, intensity = 0) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.42,
      metalness: 0.58,
      emissive,
      emissiveIntensity: intensity
    });

  const lobby = new THREE.Group();
  lobby.name = 'NEXUS_CINEMATIC_HOME';
  hub.add(lobby);

  const plaza = add(
    new THREE.CylinderGeometry(15.5, 16.2, 0.22, 64),
    material(0x111d2b, 0x173c59, 0.7),
    new THREE.Vector3(0, 0.02, 8)
  );
  plaza.userData.lobbyDecor = true;

  const innerRing = add(
    new THREE.TorusGeometry(14.3, 0.12, 12, 96),
    material(0x6bd8ff, 0x238dca, 2.4),
    new THREE.Vector3(0, 0.18, 8)
  );
  innerRing.rotation.x = Math.PI / 2;
  animated.push({ object: innerRing, type: 'ring', speed: 0.25 });

  const portal = new THREE.Group();
  portal.position.set(0, 3.8, -2.2);
  lobby.add(portal);
  const portalRing = add(
    new THREE.TorusGeometry(4.2, 0.22, 16, 64),
    material(0x8fe7ff, 0x1da8df, 3.4),
    new THREE.Vector3(0, 0, 0),
    portal
  );
  animated.push({ object: portal, type: 'portal', speed: 0.5 });
  const portalCore = add(
    new THREE.CircleGeometry(3.75, 48),
    new THREE.MeshBasicMaterial({ color: 0x12385a, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
    new THREE.Vector3(0, 0, 0.08),
    portal
  );

  const towers = [];
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    const radius = 12 + (i % 3) * 2.4;
    const h = 5 + (i % 4) * 2.5;
    const tower = add(
      new THREE.BoxGeometry(1.7 + (i % 2) * 0.7, h, 1.7 + (i % 2) * 0.7),
      material(i % 2 ? 0x17283b : 0x20364a, 0x173f66, 0.55),
      new THREE.Vector3(Math.cos(a) * radius, h / 2, 8 + Math.sin(a) * radius)
    );
    towers.push(tower);
    const strip = add(
      new THREE.BoxGeometry(0.12, h * 0.72, 0.12),
      material(0x71d8ff, 0x1d9ed1, 2.6),
      new THREE.Vector3(tower.position.x, h * 0.5, tower.position.z - 0.91)
    );
    strip.userData.lobbyLight = true;
  }

  // Futuristic hover vehicle, parked to the left of the Home pad.
  const vehicle = new THREE.Group();
  vehicle.position.set(-7.4, 0.55, 8.7);
  vehicle.rotation.y = -0.18;
  lobby.add(vehicle);
  add(new THREE.BoxGeometry(5.2, 0.72, 2.2), material(0x101824, 0x174d77, 1.2), new THREE.Vector3(0, 0.45, 0), vehicle);
  add(new THREE.BoxGeometry(3.0, 0.72, 1.45), material(0x1a2b3d, 0x286f9d, 1.4), new THREE.Vector3(0.45, 0.92, 0), vehicle);
  add(new THREE.BoxGeometry(2.1, 0.12, 1.05), material(0x5edbff, 0x27c7ff, 3.4), new THREE.Vector3(0.1, 1.27, 0), vehicle);
  for (const x of [-1.7, 1.55]) {
    for (const z of [-0.92, 0.92]) {
      const wheel = add(
        new THREE.CylinderGeometry(0.48, 0.48, 0.18, 20),
        material(0x07101a, 0x0e5c87, 1.3),
        new THREE.Vector3(x, 0.22, z),
        vehicle
      );
      wheel.rotation.x = Math.PI / 2;
    }
  }
  const vehicleGlow = add(
    new THREE.BoxGeometry(4.2, 0.08, 0.16),
    material(0x62dfff, 0x29c7ff, 3.8),
    new THREE.Vector3(0, 0.15, -1.02),
    vehicle
  );
  animated.push({ object: vehicleGlow, type: 'pulse', speed: 2.2 });

  // Small original companion drone.
  const drone = new THREE.Group();
  drone.position.set(2.35, 0.65, 8.5);
  lobby.add(drone);
  add(new THREE.SphereGeometry(0.72, 16, 12), material(0xeaf4ff, 0x4acfff, 1.4), new THREE.Vector3(0, 0.75, 0), drone);
  add(new THREE.ConeGeometry(0.18, 0.55, 4), material(0x7fe5ff, 0x2acbff, 3), new THREE.Vector3(-0.42, 1.2, 0), drone);
  add(new THREE.ConeGeometry(0.18, 0.55, 4), material(0x7fe5ff, 0x2acbff, 3), new THREE.Vector3(0.42, 1.2, 0), drone);
  add(new THREE.BoxGeometry(0.14, 0.22, 0.14), material(0x06101a, 0x5ce0ff, 3), new THREE.Vector3(0, 0.78, -0.68), drone);
  animated.push({ object: drone, type: 'drone', speed: 1.5 });

  // Holographic NEXUS sign.
  const sign = add(
    new THREE.BoxGeometry(5.4, 1.25, 0.18),
    material(0x0b1724, 0x2b8dca, 2.2),
    new THREE.Vector3(0, 4.7, 3.2)
  );
  sign.rotation.x = -0.04;
  const signBars = [];
  for (let i = 0; i < 5; i += 1) {
    const bar = add(
      new THREE.BoxGeometry(0.55 + (i % 2) * 0.25, 0.08, 0.08),
      material(0x8be7ff, 0x2bc8ff, 3.4),
      new THREE.Vector3(-1.8 + i * 0.9, 4.72, 3.05)
    );
    signBars.push(bar);
  }

  const orbitRings = [];
  for (let i = 0; i < 3; i += 1) {
    const ring = add(
      new THREE.TorusGeometry(5.4 + i * 1.3, 0.055, 8, 64),
      material(0x6fdcff, 0x2499d0, 2.2),
      new THREE.Vector3(0, 5.4 + i * 0.5, -1.8)
    );
    ring.rotation.x = Math.PI / 2 + i * 0.18;
    ring.rotation.z = i * 0.45;
    orbitRings.push(ring);
  }

  const particles = new THREE.Group();
  particles.position.set(0, 2, 8);
  lobby.add(particles);
  for (let i = 0; i < 28; i += 1) {
    const a = (i / 28) * Math.PI * 2;
    const r = 7 + (i % 5) * 1.5;
    const p = add(
      new THREE.SphereGeometry(0.055 + (i % 3) * 0.025, 7, 6),
      material(0x9ceaff, 0x3bcfff, 3.2),
      new THREE.Vector3(Math.cos(a) * r, 0.4 + (i % 6) * 0.65, Math.sin(a) * r),
      particles
    );
    animated.push({ object: p, type: 'particle', baseY: p.position.y, phase: i * 0.31, speed: 0.65 + (i % 4) * 0.12 });
  }

  animated.push({ object: portalRing, type: 'spin', speed: 0.28 });
  orbitRings.forEach((ring, i) => animated.push({ object: ring, type: 'orbit', speed: 0.16 + i * 0.06, phase: i * 0.8 }));
  towers.forEach((tower, i) => animated.push({ object: tower, type: 'tower', phase: i * 0.45, speed: 0.7 }));

  return {
    update(nowSeconds, lobbyActive) {
      if (!lobbyActive) return;
      portal.rotation.y += 0.0028;
      orbitRings.forEach((ring, i) => {
        ring.rotation.y += 0.002 + i * 0.0007;
        ring.rotation.x = Math.PI / 2 + Math.sin(nowSeconds * 0.45 + i) * 0.12;
      });
      animated.forEach((entry) => {
        const o = entry.object;
        if (entry.type === 'pulse') {
          o.material.emissiveIntensity = 2.8 + Math.sin(nowSeconds * entry.speed) * 1.1;
        } else if (entry.type === 'drone') {
          o.position.y = 0.65 + Math.sin(nowSeconds * entry.speed) * 0.16;
          o.rotation.y = Math.sin(nowSeconds * 0.45) * 0.35;
        } else if (entry.type === 'particle') {
          o.position.y = entry.baseY + Math.sin(nowSeconds * entry.speed + entry.phase) * 0.28;
        } else if (entry.type === 'spin') {
          o.rotation.z += entry.speed * 0.01;
        } else if (entry.type === 'tower') {
          o.position.y = o.geometry.parameters.height / 2 + Math.sin(nowSeconds * entry.speed + entry.phase) * 0.03;
        }
      });
    }
  };
}
