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
      roughness: 0.38,
      metalness: 0.62,
      emissive,
      emissiveIntensity: intensity
    });

  const lobby = new THREE.Group();
  lobby.name = 'NEXUS_CINEMATIC_HOME';
  hub.add(lobby);

  // Lighting accents remain lightweight: emissive geometry does most of the work.
  const cyanLight = new THREE.PointLight(0x43d7ff, 3.2, 18, 2);
  cyanLight.position.set(-7, 4.2, 8);
  lobby.add(cyanLight);
  const whiteLight = new THREE.PointLight(0xd8ecff, 2.1, 24, 2);
  whiteLight.position.set(0, 6.5, -7);
  lobby.add(whiteLight);

  // Fine floor-panel detailing around the hero standing area.
  const floorPanels = [];
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    const r = 4.2 + (i % 2) * 1.8;
    const panel = add(
      new THREE.BoxGeometry(0.88, 0.035, 0.24),
      material(0x25364a, 0x123a57, 0.8),
      new THREE.Vector3(Math.cos(a) * r, 0.17, 8 + Math.sin(a) * r)
    );
    panel.rotation.y = a + Math.PI / 2;
    floorPanels.push(panel);
  }

  // Eight slim landing pylons frame the stage and pulse in sequence.
  const stagePylons = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const p = add(
      new THREE.BoxGeometry(0.22, 2.6 + (i % 2) * 0.9, 0.22),
      material(0x142536, 0x0e4161, 0.9),
      new THREE.Vector3(Math.cos(a) * 7.1, 1.3 + (i % 2) * 0.45, 8 + Math.sin(a) * 7.1)
    );
    const glow = add(
      new THREE.BoxGeometry(0.055, 1.8, 0.055),
      material(0x6ce3ff, 0x22c8ff, 3.6),
      new THREE.Vector3(p.position.x, p.position.y, p.position.z - 0.13)
    );
    stagePylons.push(glow);
  }

  // Wide cinematic platform: the avatar is the visual anchor.
  const plaza = add(
    new THREE.CylinderGeometry(17.5, 18.2, 0.26, 72),
    material(0x101b29, 0x173c59, 0.8),
    new THREE.Vector3(0, 0.02, 8)
  );
  plaza.userData.lobbyDecor = true;

  const plazaRing = add(
    new THREE.TorusGeometry(16.1, 0.11, 10, 120),
    material(0x70dfff, 0x20a9dd, 2.8),
    new THREE.Vector3(0, 0.2, 8)
  );
  plazaRing.rotation.x = Math.PI / 2;
  animated.push({ object: plazaRing, type: 'pulseRing', speed: 1.15 });

  // Reflective runway strips frame the avatar like a premium game lobby.
  for (const x of [-5.2, 5.2]) {
    const strip = add(
      new THREE.BoxGeometry(0.12, 0.035, 15.5),
      material(0x6fdcff, 0x22b8f2, 3.1),
      new THREE.Vector3(x, 0.18, 8)
    );
    animated.push({ object: strip, type: 'runway', phase: x > 0 ? 1.4 : 0 });
  }

  // Subtle overhead canopy beams add a premium hangar-like frame to the lobby.
  const canopy = new THREE.Group();
  canopy.position.set(0, 7.4, 3);
  lobby.add(canopy);
  for (const x of [-11, -5.5, 0, 5.5, 11]) {
    const beam = add(
      new THREE.BoxGeometry(0.22, 0.22, 18),
      material(0x18293a, 0x0d2c45, 0.8),
      new THREE.Vector3(x, 0, 0),
      canopy
    );
    beam.rotation.y = 0.04;
    const strip = add(
      new THREE.BoxGeometry(0.07, 0.07, 15.5),
      material(0x5ddfff, 0x1fb9ea, 3.2),
      new THREE.Vector3(x, -0.12, -0.2),
      canopy
    );
    animated.push({ object: strip, type: 'canopy', phase: x * 0.08 });
  }

  // Holographic navigation arrows continuously sweep toward the START platform.
  const arrows = [];
  for (let i = 0; i < 6; i += 1) {
    const arrow = add(
      new THREE.ConeGeometry(0.09, 0.55, 3),
      material(0x83e8ff, 0x2bcfff, 3.8),
      new THREE.Vector3(-2.5 + i * 1.0, 0.28, 4.8)
    );
    arrow.rotation.x = -Math.PI / 2;
    arrows.push(arrow);
  }
  // Distant skyline and floating architecture create depth behind the avatar.
  const skyline = new THREE.Group();
  skyline.position.set(0, 0, -22);
  lobby.add(skyline);

  const skylinePalette = [0x172c40, 0x1b3850, 0x223e56, 0x14273a];
  for (let i = 0; i < 18; i += 1) {
    const x = -30 + i * 3.6;
    const h = 7 + (i % 6) * 2.2;
    const w = 1.7 + (i % 3) * 0.7;
    const tower = add(
      new THREE.BoxGeometry(w, h, 1.8 + (i % 2) * 0.8),
      material(skylinePalette[i % skylinePalette.length], 0x0b2942, 0.5),
      new THREE.Vector3(x, h / 2, (i % 4) * 1.5),
      skyline
    );
    const strip = add(
      new THREE.BoxGeometry(0.07, h * 0.72, 0.08),
      material(0x52d8ff, 0x1ab2e5, 2.7),
      new THREE.Vector3(x - w * 0.25, h * 0.52, -0.94),
      skyline
    );
    animated.push({ object: strip, type: 'skyline', phase: i * 0.37 });
    tower.userData.lobbyDecor = true;
  }

  // Floating rings / platforms in the distant skyline.
  const skyRings = [];
  for (let i = 0; i < 4; i += 1) {
    const ring = add(
      new THREE.TorusGeometry(3.8 + i * 1.25, 0.13, 10, 64),
      material(0x79dcff, 0x218fd0, 2.2),
      new THREE.Vector3(-9 + i * 7.0, 8.5 + (i % 2) * 2.5, -25 - i * 1.8),
      lobby
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = 0.2 + i * 0.22;
    skyRings.push(ring);
  }
  skyRings.forEach((ring, i) => animated.push({ object: ring, type: 'skyRing', speed: 0.16 + i * 0.04, phase: i }));

  // Large luminous gateway sits to the right, never blocking the avatar.
  const portal = new THREE.Group();
  portal.position.set(10.8, 4.6, -8.5);
  portal.rotation.y = -0.12;
  lobby.add(portal);

  const portalRing = add(
    new THREE.TorusGeometry(4.0, 0.2, 16, 72),
    material(0x8eeaff, 0x1da8df, 3.8),
    new THREE.Vector3(0, 0, 0),
    portal
  );
  const portalCore = add(
    new THREE.CircleGeometry(3.55, 48),
    new THREE.MeshBasicMaterial({
      color: 0x102f4d,
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide
    }),
    new THREE.Vector3(0, 0, 0.05),
    portal
  );
  portalCore.userData.lobbyDecor = true;
  animated.push({ object: portalRing, type: 'portal', speed: 0.22 });
  animated.push({ object: portalCore, type: 'portalCore', speed: 0.9 });

  // Premium hover vehicle parked on the left, with animated underglow.
  const vehicle = new THREE.Group();
  vehicle.position.set(-8.0, 0.35, 8.5);
  vehicle.rotation.y = -0.12;
  lobby.add(vehicle);

  add(new THREE.BoxGeometry(5.6, 0.55, 2.25), material(0x07111b, 0x0c4670, 1.0), new THREE.Vector3(0, 0.45, 0), vehicle);
  add(new THREE.BoxGeometry(3.4, 0.62, 1.5), material(0x14283b, 0x176a98, 1.5), new THREE.Vector3(0.35, 0.92, 0), vehicle);
  add(new THREE.BoxGeometry(2.25, 0.08, 1.05), material(0x7ce5ff, 0x25c9ff, 3.8), new THREE.Vector3(0.1, 1.27, 0), vehicle);

  for (const x of [-1.8, 1.65]) {
    for (const z of [-0.96, 0.96]) {
      const wheel = add(
        new THREE.CylinderGeometry(0.5, 0.5, 0.18, 24),
        material(0x03070d, 0x0b4f78, 1.6),
        new THREE.Vector3(x, 0.22, z),
        vehicle
      );
      wheel.rotation.x = Math.PI / 2;
    }
  }

  const vehicleGlow = add(
    new THREE.BoxGeometry(4.7, 0.08, 0.14),
    material(0x62dfff, 0x29c7ff, 4.2),
    new THREE.Vector3(0, 0.12, -1.08),
    vehicle
  );
  animated.push({ object: vehicleGlow, type: 'pulse', speed: 2.4 });

  const vehicleBeacon = add(
    new THREE.SphereGeometry(0.11, 10, 8),
    material(0xffc84a, 0xff9b00, 3.0),
    new THREE.Vector3(2.2, 1.1, -0.6),
    vehicle
  );
  animated.push({ object: vehicleBeacon, type: 'blink', speed: 3.0 });

  // Original companion: small floating robot beside the avatar.
  const companion = new THREE.Group();
  companion.position.set(2.35, 0.35, 8.8);
  lobby.add(companion);
  add(new THREE.SphereGeometry(0.7, 18, 14), material(0xe9f4ff, 0x46cfff, 1.7), new THREE.Vector3(0, 0.85, 0), companion);
  add(new THREE.BoxGeometry(0.36, 0.5, 0.34), material(0x1a3042, 0x1a91c4, 1.7), new THREE.Vector3(0, 0.34, 0), companion);
  add(new THREE.SphereGeometry(0.13, 10, 8), material(0x07111b, 0x5ce0ff, 3.8), new THREE.Vector3(0, 0.84, -0.62), companion);
  for (const x of [-0.43, 0.43]) {
    add(new THREE.ConeGeometry(0.15, 0.48, 4), material(0x78e2ff, 0x2acbff, 3.2), new THREE.Vector3(x, 1.28, 0), companion);
  }
  animated.push({ object: companion, type: 'companion', speed: 1.35 });

  // Small service drones provide living motion in the background.
  const serviceDrones = [];
  for (let i = 0; i < 3; i += 1) {
    const d = new THREE.Group();
    d.position.set(-10 + i * 10, 3.6 + i * 0.7, -3.5 - i * 2.2);
    lobby.add(d);
    add(new THREE.SphereGeometry(0.22, 10, 8), material(0xbdefff, 0x2acfff, 3.5), new THREE.Vector3(0, 0, 0), d);
    add(new THREE.BoxGeometry(0.62, 0.05, 0.08), material(0x58dcff, 0x2ccaff, 3.2), new THREE.Vector3(0, 0, 0), d);
    serviceDrones.push(d);
  }

  // Large NEXUS holographic sign in the left background.
  const sign = add(
    new THREE.BoxGeometry(4.8, 1.45, 0.16),
    material(0x081522, 0x1c79ad, 2.3),
    new THREE.Vector3(-3.8, 4.2, -8.0)
  );
  sign.rotation.y = 0.08;
  for (let i = 0; i < 6; i += 1) {
    const bar = add(
      new THREE.BoxGeometry(0.48 + (i % 2) * 0.18, 0.07, 0.07),
      material(0x8ce9ff, 0x2bc8ff, 3.6),
      new THREE.Vector3(-5.35 + i * 0.62, 4.2, -8.14)
    );
    animated.push({ object: bar, type: 'sign', phase: i * 0.4 });
  }

  // Sun / horizon glow gives the lobby a brighter "world" feeling.
  const sun = add(
    new THREE.CircleGeometry(5.5, 48),
    new THREE.MeshBasicMaterial({ color: 0x8fdcff, transparent: true, opacity: 0.16, side: THREE.DoubleSide }),
    new THREE.Vector3(0, 10.5, -31)
  );
  sun.rotation.x = -0.05;
  animated.push({ object: sun, type: 'sun', speed: 0.2 });

  // Atmospheric particles.
  const particles = new THREE.Group();
  particles.position.set(0, 1.5, 5);
  lobby.add(particles);
  for (let i = 0; i < 42; i += 1) {
    const a = (i / 42) * Math.PI * 2;
    const r = 6 + (i % 7) * 1.7;
    const p = add(
      new THREE.SphereGeometry(0.045 + (i % 3) * 0.02, 7, 6),
      material(0x9ceaff, 0x3bcfff, 3.2),
      new THREE.Vector3(Math.cos(a) * r, 0.4 + (i % 9) * 0.62, Math.sin(a) * r),
      particles
    );
    animated.push({ object: p, type: 'particle', baseY: p.position.y, phase: i * 0.31, speed: 0.6 + (i % 4) * 0.12 });
  }

  return {
    update(nowSeconds, lobbyActive) {
      if (!lobbyActive) return;

      plazaRing.rotation.z += 0.0014;
      plazaRing.material.emissiveIntensity = 2.2 + Math.sin(nowSeconds * 1.15) * 0.7;

      stagePylons.forEach((glow, i) => {
        glow.material.emissiveIntensity = 1.8 + (Math.sin(nowSeconds * 2.1 - i * 0.55) + 1) * 1.25;
      });
      arrows.forEach((arrow, i) => {
        arrow.position.x = -2.5 + i * 1.0 + Math.sin(nowSeconds * 0.9 + i) * 0.06;
        arrow.material.emissiveIntensity = 2.6 + (Math.sin(nowSeconds * 2.0 - i * 0.7) + 1) * 0.8;
      });
      serviceDrones.forEach((d, i) => {
        const a = nowSeconds * (0.26 + i * 0.045) + i * 2.1;
        d.position.x = Math.cos(a) * (9 + i * 1.8);
        d.position.z = 8 + Math.sin(a) * (7 + i * 1.8) - 2;
        d.position.y = 3.0 + i * 0.65 + Math.sin(nowSeconds * 1.4 + i) * 0.35;
        d.rotation.y = -a + Math.PI / 2;
      });

      animated.forEach((entry) => {
        const o = entry.object;
        if (entry.type === 'pulse') {
          o.material.emissiveIntensity = 3.2 + Math.sin(nowSeconds * entry.speed) * 1.1;
        } else if (entry.type === 'blink') {
          o.material.emissiveIntensity = 1.2 + Math.max(0, Math.sin(nowSeconds * entry.speed)) * 3.4;
        } else if (entry.type === 'companion') {
          o.position.y = 0.35 + Math.sin(nowSeconds * entry.speed) * 0.14;
          o.rotation.y = Math.sin(nowSeconds * 0.5) * 0.4;
        } else if (entry.type === 'portal') {
          o.rotation.z += entry.speed * 0.012;
          o.material.emissiveIntensity = 3.0 + Math.sin(nowSeconds * 1.4) * 0.8;
        } else if (entry.type === 'portalCore') {
          o.material.opacity = 0.28 + (Math.sin(nowSeconds * entry.speed) + 1) * 0.08;
        } else if (entry.type === 'skyRing') {
          o.rotation.y += entry.speed * 0.008;
          o.rotation.z += entry.speed * 0.004;
        } else if (entry.type === 'skyline') {
          o.material.emissiveIntensity = 2.0 + Math.sin(nowSeconds * 0.8 + entry.phase) * 0.8;
        } else if (entry.type === 'runway') {
          o.material.emissiveIntensity = 2.4 + Math.sin(nowSeconds * 1.4 + entry.phase) * 0.7;
        } else if (entry.type === 'canopy') {
          o.material.emissiveIntensity = 2.5 + Math.sin(nowSeconds * 1.6 + entry.phase) * 0.65;
        } else if (entry.type === 'sign') {
          o.material.emissiveIntensity = 2.4 + Math.sin(nowSeconds * 1.7 + entry.phase) * 1.2;
        } else if (entry.type === 'sun') {
          o.material.opacity = 0.13 + Math.sin(nowSeconds * entry.speed) * 0.025;
        } else if (entry.type === 'particle') {
          o.position.y = entry.baseY + Math.sin(nowSeconds * entry.speed + entry.phase) * 0.28;
        } else if (entry.type === 'pulseRing') {
          o.rotation.z += 0.002;
        }
      });
    }
  };
}
