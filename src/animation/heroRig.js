import * as THREE from 'three';

/*
 * NEXUS HERO — reference-driven original 3D character rig.
 * Visual target: black/white futuristic street armor, electric-blue emissive
 * details, long asymmetric coat, spiky black hair, armored boots and sheathed
 * energy blade. All geometry is procedural so the mobile build has no texture
 * download dependency.
 */
export function buildHeroRig({ scene, player, mat }) {
  const body = new THREE.Group();
  body.name = 'NEXUS_HERO_RIG';

  const skin = new THREE.MeshStandardMaterial({ color: 0xd9b8a8, roughness: 0.56, metalness: 0.02 });
  const skinDark = new THREE.MeshStandardMaterial({ color: 0x8e5f58, roughness: 0.7, metalness: 0.02 });
  const black = new THREE.MeshStandardMaterial({ color: 0x05070b, roughness: 0.3, metalness: 0.72 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x10141b, roughness: 0.66, metalness: 0.18 });
  const white = new THREE.MeshStandardMaterial({ color: 0xd9dde2, roughness: 0.48, metalness: 0.28 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xaeb8c4, roughness: 0.25, metalness: 0.88 });
  const blue = new THREE.MeshStandardMaterial({
    color: 0x47bfff, roughness: 0.2, metalness: 0.55,
    emissive: 0x087dff, emissiveIntensity: 3.2
  });
  const darkBlue = new THREE.MeshStandardMaterial({
    color: 0x10263d, roughness: 0.32, metalness: 0.65,
    emissive: 0x06345b, emissiveIntensity: 1.25
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x081522, roughness: 0.12, metalness: 0.55,
    emissive: 0x116dca, emissiveIntensity: 1.8
  });

  const M = (geometry, material, p = new THREE.Vector3(), parent = body) => {
    const o = new THREE.Mesh(geometry, material);
    o.position.copy(p);
    o.castShadow = false;
    o.receiveShadow = false;
    parent.add(o);
    return o;
  };
  const G = (name, p = new THREE.Vector3(), parent = body) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.copy(p);
    parent.add(g);
    return g;
  };
  const panel = (w, h, d, material, p, parent = body, bevel = 0.08) => {
    const o = M(new THREE.BoxGeometry(w, h, d), material, p, parent);
    o.userData.detail = 'panel';
    o.scale.set(1, 1, 1);
    return o;
  };
  const glowStrip = (w, h, p, parent = body) =>
    M(new THREE.BoxGeometry(w, h, 0.035), blue, p, parent);

  // HIPS / BELT
  const hips = G('hips', new THREE.Vector3(0, 0.98, 0));
  panel(0.9, 0.26, 0.58, black, new THREE.Vector3(0, 0, 0), hips);
  const belt = G('belt', new THREE.Vector3(0, 1.16, -0.01));
  panel(0.98, 0.13, 0.62, black, new THREE.Vector3(0, 0, 0), belt);
  panel(0.18, 0.15, 0.06, silver, new THREE.Vector3(0, 0, -0.33), belt);
  panel(0.10, 0.07, 0.025, blue, new THREE.Vector3(0, 0, -0.37), belt);

  // TORSO — fitted black tactical suit + armored chest.
  const torso = G('torso', new THREE.Vector3(0, 1.08, 0));
  M(new THREE.CapsuleGeometry(0.48, 0.82, 10, 20), cloth, new THREE.Vector3(0, 0.38, 0), torso);
  panel(0.72, 0.64, 0.16, black, new THREE.Vector3(0, 0.43, -0.44), torso);
  panel(0.52, 0.48, 0.075, darkBlue, new THREE.Vector3(0, 0.49, -0.51), torso);
  const chestCore = M(new THREE.OctahedronGeometry(0.105, 2), blue, new THREE.Vector3(0, 0.48, -0.57), torso);
  glowStrip(0.08, 0.31, new THREE.Vector3(-0.26, 0.49, -0.555), torso);
  glowStrip(0.08, 0.31, new THREE.Vector3(0.26, 0.49, -0.555), torso);

  // Neck + human-like head.
  const neck = G('neck', new THREE.Vector3(0, 1.91, 0));
  M(new THREE.CylinderGeometry(0.12, 0.15, 0.24, 16), skinDark, new THREE.Vector3(0, 0.08, 0), neck);
  const head = G('head', new THREE.Vector3(0, 2.14, -0.005));
  const face = M(new THREE.SphereGeometry(0.39, 32, 24), skin, new THREE.Vector3(0, 0.24, 0), head);
  face.scale.set(0.86, 1.05, 0.92);
  // Jaw/chin planes.
  M(new THREE.SphereGeometry(0.25, 24, 16), skin, new THREE.Vector3(0, 0.05, -0.025), head).scale.set(0.9, 0.52, 0.76);

  // Eyes / brows / nose / mouth are geometry, not a flat visor.
  const eyeL = M(new THREE.SphereGeometry(0.045, 14, 10), glass, new THREE.Vector3(-0.125, 0.29, -0.355), head);
  const eyeR = M(new THREE.SphereGeometry(0.045, 14, 10), glass, new THREE.Vector3(0.125, 0.29, -0.355), head);
  eyeL.scale.set(1.45, 0.58, 0.45); eyeR.scale.copy(eyeL.scale);
  panel(0.16, 0.025, 0.018, black, new THREE.Vector3(-0.125, 0.365, -0.36), head);
  panel(0.16, 0.025, 0.018, black, new THREE.Vector3(0.125, 0.365, -0.36), head);
  M(new THREE.ConeGeometry(0.035, 0.11, 8), skinDark, new THREE.Vector3(0, 0.18, -0.365), head).rotation.x = Math.PI / 2;
  panel(0.13, 0.025, 0.02, skinDark, new THREE.Vector3(0, 0.08, -0.365), head);

  // Spiky black hair: crown + long directional spikes.
  const hair = G('hair', new THREE.Vector3(0, 0.46, 0), head);
  M(new THREE.SphereGeometry(0.43, 28, 18), black, new THREE.Vector3(0, 0, 0), hair).scale.set(1.02, 0.82, 0.96);
  const hairSpikes = [];
  for (let i = 0; i < 24; i += 1) {
    const a = (i / 24) * Math.PI * 2;
    const front = i > 17 || i < 4;
    const len = front ? 0.42 + (i % 4) * 0.06 : 0.30 + (i % 5) * 0.055;
    const spike = M(new THREE.ConeGeometry(0.065, len, 7), black,
      new THREE.Vector3(Math.cos(a) * 0.28, 0.10 + (i % 3) * 0.025, Math.sin(a) * 0.23), hair);
    spike.rotation.z = Math.cos(a) * 0.9;
    spike.rotation.x = -Math.sin(a) * 0.9 - (front ? 0.18 : 0);
    hairSpikes.push(spike);
  }
  // Long side locks.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i += 1) {
      const lock = M(new THREE.ConeGeometry(0.045, 0.34 + i * 0.055, 6), black,
        new THREE.Vector3(side * (0.29 + i * 0.025), 0.02 - i * 0.06, -0.03 - i * 0.01), hair);
      lock.rotation.z = side * 0.28;
      hairSpikes.push(lock);
    }
  }

  // SHOULDERS / ARMS / GLOVES.
  const makeArm = (side) => {
    const tag = side < 0 ? 'L' : 'R';
    const x = side * 0.64;
    const shoulder = G('shoulder-' + tag, new THREE.Vector3(x, 1.72, 0));
    const armor = M(new THREE.SphereGeometry(0.30, 20, 14), silver, new THREE.Vector3(0, 0, -0.02), shoulder);
    armor.scale.set(1.35, 0.72, 1.22);
    panel(0.22, 0.20, 0.08, darkBlue, new THREE.Vector3(0, 0.02, -0.28), shoulder);
    M(new THREE.TetrahedronGeometry(0.10, 1), blue, new THREE.Vector3(0, 0.02, -0.34), shoulder);

    const upper = G('upper-arm-' + tag, new THREE.Vector3(0, -0.09, 0), shoulder);
    M(new THREE.CapsuleGeometry(0.14, 0.55, 8, 12), cloth, new THREE.Vector3(0, -0.34, 0), upper);
    const fore = G('forearm-' + tag, new THREE.Vector3(0, -0.69, 0), upper);
    M(new THREE.CapsuleGeometry(0.14, 0.53, 8, 12), black, new THREE.Vector3(0, -0.29, 0), fore);
    panel(0.22, 0.32, 0.26, silver, new THREE.Vector3(0, -0.34, -0.13), fore);
    glowStrip(0.14, 0.035, new THREE.Vector3(0, -0.34, -0.285), fore);

    const hand = G('hand-' + tag, new THREE.Vector3(0, -0.64, 0), fore);
    M(new THREE.SphereGeometry(0.155, 18, 14), skin, new THREE.Vector3(0, -0.06, 0), hand);
    panel(0.23, 0.22, 0.20, black, new THREE.Vector3(0, 0.01, -0.10), hand);
    const fingers = [];
    for (let i = 0; i < 5; i += 1) {
      const f = G('finger-' + tag + '-' + (i + 1),
        new THREE.Vector3((i - 2) * 0.045, -0.16, -0.08), hand);
      M(new THREE.CapsuleGeometry(0.021, 0.10, 5, 7), black, new THREE.Vector3(0, -0.055, 0), f);
      fingers.push(f);
    }
    const shoulderLight = glowStrip(0.18, 0.035, new THREE.Vector3(0, 0.01, -0.31), shoulder);
    return { arm: upper, shoulder, hand, fingers, shoulderLight };
  };

  const Larm = makeArm(-1);
  const Rarm = makeArm(1);
  const shoulders = [Larm.shoulder, Rarm.shoulder];

  // TACTICAL PANTS + KNEE ARMOR + HIGH-TECH BOOTS.
  const makeLeg = (side) => {
    const tag = side < 0 ? 'L' : 'R';
    const x = side * 0.23;
    const thigh = G('thigh-' + tag, new THREE.Vector3(x, 0.92, 0));
    M(new THREE.CapsuleGeometry(0.18, 0.68, 8, 12), cloth, new THREE.Vector3(0, -0.38, 0), thigh);
    panel(0.34, 0.30, 0.31, black, new THREE.Vector3(0, -0.34, -0.13), thigh);
    panel(0.08, 0.38, 0.035, silver, new THREE.Vector3(side * 0.12, -0.40, -0.30), thigh);
    const knee = G('knee-' + tag, new THREE.Vector3(0, -0.77, -0.02), thigh);
    panel(0.36, 0.23, 0.34, silver, new THREE.Vector3(0, 0, -0.14), knee);
    M(new THREE.TetrahedronGeometry(0.09, 1), blue, new THREE.Vector3(0, 0, -0.32), knee);
    const shin = G('shin-' + tag, new THREE.Vector3(0, -0.12, 0), knee);
    M(new THREE.CapsuleGeometry(0.16, 0.66, 8, 12), black, new THREE.Vector3(0, -0.36, 0), shin);
    const boot = G('boot-' + tag, new THREE.Vector3(0, -0.76, -0.08), shin);
    M(new THREE.BoxGeometry(0.40, 0.30, 0.70), black, new THREE.Vector3(0, -0.08, -0.10), boot);
    panel(0.34, 0.20, 0.42, silver, new THREE.Vector3(0, -0.02, -0.30), boot);
    glowStrip(0.34, 0.055, new THREE.Vector3(0, -0.20, -0.45), boot);
    panel(0.46, 0.10, 0.72, darkBlue, new THREE.Vector3(0, -0.23, -0.10), boot);
    return { leg: thigh, boot };
  };
  const Lleg = makeLeg(-1);
  const Rleg = makeLeg(1);

  // Long asymmetric black/white coat tails.
  const coatL = G('coatL', new THREE.Vector3(-0.30, 1.06, 0.16));
  const coatR = G('coatR', new THREE.Vector3(0.30, 1.06, 0.16));
  panel(0.46, 1.52, 0.12, white, new THREE.Vector3(0, 0, 0), coatL);
  panel(0.46, 1.52, 0.12, white, new THREE.Vector3(0, 0, 0), coatR);
  panel(0.16, 1.42, 0.035, black, new THREE.Vector3(-0.17, 0, -0.075), coatL);
  panel(0.16, 1.42, 0.035, black, new THREE.Vector3(0.17, 0, -0.075), coatR);
  glowStrip(0.07, 1.28, new THREE.Vector3(-0.22, 0, -0.075), coatL);
  glowStrip(0.07, 1.28, new THREE.Vector3(0.22, 0, -0.075), coatR);
  coatL.rotation.z = -0.055; coatR.rotation.z = 0.055;

  // Back emblem / backpack.
  const backpack = G('backpack', new THREE.Vector3(0, 1.44, 0.42));
  panel(0.70, 0.92, 0.30, black, new THREE.Vector3(0, 0, 0), backpack);
  panel(0.48, 0.50, 0.035, white, new THREE.Vector3(0, 0.05, 0.17), backpack);
  M(new THREE.TetrahedronGeometry(0.19, 1), blue, new THREE.Vector3(0, 0.04, 0.20), backpack);
  const backpackLight = glowStrip(0.34, 0.045, new THREE.Vector3(0, -0.29, 0.18), backpack);

  // Shoulder-to-hip straps and chain-like accessory.
  const strapL = panel(0.09, 1.38, 0.045, white, new THREE.Vector3(-0.37, 1.42, -0.48));
  strapL.rotation.z = -0.22;
  const strapR = panel(0.09, 1.38, 0.045, white, new THREE.Vector3(0.37, 1.42, -0.48));
  strapR.rotation.z = 0.22;
  const chain = G('chain', new THREE.Vector3(-0.36, 1.02, -0.54));
  for (let i = 0; i < 7; i += 1) {
    const link = M(new THREE.TorusGeometry(0.045, 0.012, 6, 10), silver,
      new THREE.Vector3(0.07 * Math.sin(i), -i * 0.10, 0), chain);
    link.rotation.x = Math.PI / 2;
    link.rotation.z = i % 2 ? 0.55 : -0.55;
  }

  // Sheathed energy sword over right shoulder/back.
  const sword = G('sword', new THREE.Vector3(0.47, 1.62, 0.48));
  sword.rotation.z = -0.22;
  panel(0.15, 1.48, 0.15, black, new THREE.Vector3(0, 0.18, 0), sword);
  panel(0.08, 1.26, 0.045, blue, new THREE.Vector3(0, 0.72, -0.02), sword);
  panel(0.38, 0.08, 0.08, silver, new THREE.Vector3(0, -0.57, 0), sword);
  panel(0.12, 0.22, 0.12, black, new THREE.Vector3(0, -0.70, 0), sword);

  const parts = {
    la: Larm.arm, ra: Rarm.arm, ll: Lleg.leg, rl: Rleg.leg,
    torso, head, bootL: Lleg.boot, bootR: Rleg.boot, backpack,
    backpackLight, accent: chestCore, chestCore, coatL, coatR, sword,
    visorGlow: glass, hands: [Larm.hand, Rarm.hand],
    fingers: [...Larm.fingers, ...Rarm.fingers],
    eyes: [eyeL, eyeR], shoulders, hips, hairSpikes,
    shoulderLightL: Larm.shoulderLight, shoulderLightR: Rarm.shoulderLight,
    seamL: glowStrip(0.06, 0.9, new THREE.Vector3(-0.42, 1.0, -0.04)),
    seamR: glowStrip(0.06, 0.9, new THREE.Vector3(0.42, 1.0, -0.04)),
    microDetails: { face, hairSpikes, strapL, strapR, chain }
  };

  player.group.userData.parts = parts;
  body.add(coatL); body.add(coatR);
  player.group.add(body);
  player.group.position.copy(player.pos);
  scene.add(player.group);
}
