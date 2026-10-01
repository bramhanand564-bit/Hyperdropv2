import * as THREE from 'three';

export function buildHeroRig({ scene, player, mat }) {
  const body = new THREE.Group();
  body.name = 'NEXUS_HERO_RIG';

  const skin = mat(0xd8c0b4, .7, .04);
  const black = mat(0x050a10, .32, .72, 0x071d30);
  const suit = mat(0x101722, .46, .62, 0x0a3150);
  const suit2 = mat(0x202a37, .5, .5, 0x102f4a);
  const blue = mat(0x62dcff, .2, .55, 0x20c8ff);
  const blue2 = mat(0x2d83b5, .28, .5, 0x14557d);
  const silver = mat(0xb9c7d5, .32, .7, 0x193e5a);

  const M = (g, m, p, parent = body) => {
    const o = new THREE.Mesh(g, m);
    o.position.copy(p);
    parent.add(o);
    return o;
  };
  const G = (name, p, parent = body) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.copy(p);
    parent.add(g);
    return g;
  };

  const hips = G('hips', new THREE.Vector3(0, .98, 0));
  M(new THREE.BoxGeometry(.9, .24, .56), black, new THREE.Vector3(), hips);
  M(new THREE.BoxGeometry(.18, .14, .08), silver, new THREE.Vector3(0, 0, -.31), hips);

  const torso = G('torso', new THREE.Vector3(0, 1.08, 0));
  M(new THREE.CapsuleGeometry(.5, .86, 8, 16), suit, new THREE.Vector3(0, .38, 0), torso);
  M(new THREE.BoxGeometry(.68, .58, .18), suit2, new THREE.Vector3(0, .44, -.43), torso);
  const core = M(new THREE.OctahedronGeometry(.13, 1), blue, new THREE.Vector3(0, .48, -.56), torso);

  const neck = G('neck', new THREE.Vector3(0, 1.93, 0));
  M(new THREE.CylinderGeometry(.13, .16, .22, 12), skin, new THREE.Vector3(0, .08, 0), neck);
  const head = G('head', new THREE.Vector3(0, 2.17, 0));
  M(new THREE.SphereGeometry(.39, 24, 18), skin, new THREE.Vector3(0, .22, 0), head);
  const visor = M(new THREE.BoxGeometry(.5, .13, .12), black, new THREE.Vector3(0, .22, -.36), head);
  const visorGlow = M(new THREE.BoxGeometry(.36, .035, .025), blue, new THREE.Vector3(0, .23, -.425), head);
  const eyeL = M(new THREE.SphereGeometry(.035, 10, 8), blue, new THREE.Vector3(-.11, .26, -.43), head);
  const eyeR = M(new THREE.SphereGeometry(.035, 10, 8), blue, new THREE.Vector3(.11, .26, -.43), head);

  const hair = G('hair', new THREE.Vector3(0, .46, 0), head);
  M(new THREE.SphereGeometry(.43, 20, 14), black, new THREE.Vector3(), hair);
  const hairSpikes = [];
  for (let i = 0; i < 15; i += 1) {
    const a = i / 15 * Math.PI * 2;
    const s = M(new THREE.ConeGeometry(.065, .45 + (i % 4) * .08, 5), black, new THREE.Vector3(Math.cos(a) * .25, .12, Math.sin(a) * .23), hair);
    s.rotation.z = Math.cos(a) * .75;
    s.rotation.x = -Math.sin(a) * .75;
    hairSpikes.push(s);
  }

  const makeArm = (side) => {
    const x = side * .66;
    const shoulder = G(`shoulder-${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(x, 1.72, 0));
    const sh = M(new THREE.SphereGeometry(.28, 14, 10), silver, new THREE.Vector3(), shoulder);
    sh.scale.set(1.25, .72, 1.05);
    const upper = G(`upper-arm-${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(0, -.08, 0), shoulder);
    M(new THREE.CapsuleGeometry(.14, .55, 6, 10), suit2, new THREE.Vector3(0, -.34, 0), upper);
    const elbow = G(`elbow-${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(0, -.68, 0), upper);
    M(new THREE.BoxGeometry(.25, .2, .3), black, new THREE.Vector3(), elbow);
    const fore = G(`forearm-${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(0, -.1, 0), elbow);
    M(new THREE.CapsuleGeometry(.13, .52, 6, 10), suit2, new THREE.Vector3(0, -.3, 0), fore);
    M(new THREE.BoxGeometry(.16, .055, .05), blue, new THREE.Vector3(0, -.58, -.16), fore);
    const hand = G(`hand-${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(0, -.63, 0), fore);
    M(new THREE.SphereGeometry(.16, 12, 10), skin, new THREE.Vector3(0, -.07, 0), hand);
    const fingers = [];
    for (let i = 0; i < 5; i += 1) {
      const finger = G(`finger-${side < 0 ? 'L' : 'R'}-${i + 1}`, new THREE.Vector3((i - 2) * .045, -.17, -.07), hand);
      M(new THREE.CapsuleGeometry(.022, .11, 4, 6), black, new THREE.Vector3(0, -.06, 0), finger);
      fingers.push(finger);
    }
    return { arm: upper, hand, fingers };
  };

  const Larm = makeArm(-1);
  const Rarm = makeArm(1);

  const makeLeg = (side) => {
    const x = side * .22;
    const thigh = G(`thigh-${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(x, .92, 0));
    M(new THREE.CapsuleGeometry(.17, .68, 6, 10), black, new THREE.Vector3(0, -.38, 0), thigh);
    const knee = G(`knee-${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(0, -.76, -.02), thigh);
    M(new THREE.BoxGeometry(.34, .22, .32), silver, new THREE.Vector3(0, 0, -.14), knee);
    const shin = G(`shin-${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(0, -.1, 0), knee);
    M(new THREE.CapsuleGeometry(.16, .7, 6, 10), black, new THREE.Vector3(0, -.38, 0), shin);
    const boot = G(`boot-${side < 0 ? 'L' : 'R'}`, new THREE.Vector3(0, -.78, -.07), shin);
    M(new THREE.BoxGeometry(.39, .28, .72), black, new THREE.Vector3(0, -.08, -.1), boot);
    M(new THREE.BoxGeometry(.4, .065, .1), blue, new THREE.Vector3(0, -.12, -.43), boot);
    return { leg: thigh, boot };
  };

  const Lleg = makeLeg(-1);
  const Rleg = makeLeg(1);

  const coatL = M(new THREE.BoxGeometry(.52, 1.45, .12), suit, new THREE.Vector3(-.31, 1.0, .34));
  const coatR = M(new THREE.BoxGeometry(.52, 1.45, .12), suit, new THREE.Vector3(.31, 1.0, .34));
  coatL.rotation.z = -.06;
  coatR.rotation.z = .06;
  M(new THREE.BoxGeometry(.08, 1.32, .04), blue2, new THREE.Vector3(-.58, 1, .27));
  M(new THREE.BoxGeometry(.08, 1.32, .04), blue2, new THREE.Vector3(.58, 1, .27));

  const backpack = M(new THREE.BoxGeometry(.72, .92, .3), black, new THREE.Vector3(0, 1.42, .43));
  M(new THREE.BoxGeometry(.36, .07, .06), blue, new THREE.Vector3(0, 1.58, .59), body);

  const sword = G('sword', new THREE.Vector3(.43, 1.65, .42));
  sword.rotation.z = -.22;
  M(new THREE.BoxGeometry(.12, 1.45, .12), black, new THREE.Vector3(0, .18, 0), sword);
  M(new THREE.BoxGeometry(.08, 1.22, .06), blue, new THREE.Vector3(0, .72, 0), sword);
  M(new THREE.BoxGeometry(.34, .08, .08), silver, new THREE.Vector3(0, -.55, 0), sword);

  player.group.userData.parts = {
    la: Larm.arm, ra: Rarm.arm, ll: Lleg.leg, rl: Rleg.leg,
    torso, head, bootL: Lleg.boot, bootR: Rleg.boot, backpack,
    accent: core, coatL, coatR, sword, visorGlow, chestCore: core,
    coatHemL: coatL, coatHemR: coatL, hands: [Larm.hand, Rarm.hand],
    fingers: [...Larm.fingers, ...Rarm.fingers],
    eyes: [eyeL, eyeR], hairSpikes, microDetails: { eyeL, eyeR, hairSpikes }
  };
  player.group.add(body);
  player.group.position.copy(player.pos);
  scene.add(player.group);
}
