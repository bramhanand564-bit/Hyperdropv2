import * as THREE from 'three';

export function buildHeroRig({ scene, player, mat }) {
  const body = new THREE.Group();
  body.name = 'NEXUS_HERO_RIG';

  // Reference-driven palette: black tactical base + white coat + silver armor + electric blue emissive.
  const skin = mat(0xe0b9a8, .72, .08);
  const skinDark = mat(0x9d6f63, .55, .12);
  const black = mat(0x070b12, .28, .78, 0x07121e);
  const fabric = mat(0x111722, .55, .58, 0x0b2136);
  const fabric2 = mat(0x252d38, .62, .46, 0x102b43);
  const white = mat(0xdfe5eb, .46, .42, 0x152b42);
  const silver = mat(0xb9c6d2, .3, .82, 0x193b57);
  const darkMetal = mat(0x27313b, .32, .9, 0x10263b);
  const blue = mat(0x4fdcff, .16, .62, 0x19cfff);
  const blue2 = mat(0x146ea4, .24, .68, 0x0b4e7a);

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
  const box = (x,y,z,m,p,parent=body) => M(new THREE.BoxGeometry(x,y,z),m,p,parent);
  const cyl = (r,h,m,p,parent=body,seg=16) => M(new THREE.CylinderGeometry(r,r,h,seg),m,p,parent);

  // Hips / layered tactical waist.
  const hips = G('hips', new THREE.Vector3(0, .98, 0));
  box(.92,.24,.58,black,new THREE.Vector3(),hips);
  box(.72,.18,.62,darkMetal,new THREE.Vector3(0,.12,-.01),hips);
  box(.18,.14,.08,silver,new THREE.Vector3(0,.02,-.34),hips);

  const belt = box(1.02,.14,.66,black,new THREE.Vector3(0,1.22,-.01));
  const buckle = box(.22,.18,.06,silver,new THREE.Vector3(0,1.22,-.36));
  box(.08,.24,.04,blue,new THREE.Vector3(-.38,1.22,-.38));
  box(.08,.24,.04,blue,new THREE.Vector3(.38,1.22,-.38));

  // Fitted tactical torso with chest plate, collar and illuminated core.
  const torso = G('torso', new THREE.Vector3(0,1.08,0));
  M(new THREE.CapsuleGeometry(.49,.84,10,20),fabric,new THREE.Vector3(0,.39,0),torso);
  box(.72,.62,.18,fabric2,new THREE.Vector3(0,.44,-.43),torso);
  box(.48,.38,.08,black,new THREE.Vector3(0,.53,-.52),torso);
  const core = M(new THREE.OctahedronGeometry(.14,1),blue,new THREE.Vector3(0,.49,-.57),torso);
  box(.08,.54,.035,blue2,new THREE.Vector3(-.28,.48,-.55),torso);
  box(.08,.54,.035,blue2,new THREE.Vector3(.28,.48,-.55),torso);

  // Neck + face: narrower jaw and high-collar silhouette.
  const neck = G('neck',new THREE.Vector3(0,1.93,0));
  cyl(.135,.24,skin,new THREE.Vector3(0,.09,0),neck,16);
  box(.48,.28,.38,black,new THREE.Vector3(0,.02,-.03),neck);

  const head = G('head',new THREE.Vector3(0,2.17,0));
  M(new THREE.SphereGeometry(.385,32,24),skin,new THREE.Vector3(0,.22,0),head);
  // Jaw/chin shaping layers.
  M(new THREE.SphereGeometry(.26,24,18),skinDark,new THREE.Vector3(0,.08,-.01),head).scale.set(.92,.52,.72);
  // Eyes and subtle brows.
  const eyeL=M(new THREE.SphereGeometry(.035,12,10),blue,new THREE.Vector3(-.115,.27,-.385),head);
  const eyeR=M(new THREE.SphereGeometry(.035,12,10),blue,new THREE.Vector3(.115,.27,-.385),head);
  box(.14,.025,.018,black,new THREE.Vector3(-.115,.33,-.39),head).rotation.z=.10;
  box(.14,.025,.018,black,new THREE.Vector3(.115,.33,-.39),head).rotation.z=-.10;
  // Blue visor strip retained as a restrained futuristic accent.
  const visor=box(.54,.09,.10,black,new THREE.Vector3(0,.205,-.365),head);
  const visorGlow=box(.37,.022,.018,blue,new THREE.Vector3(0,.205,-.421),head);

  // Hair: layered dark mass plus many directional spikes, closer to the reference silhouette.
  const hair=G('hair',new THREE.Vector3(0,.49,.015),head);
  M(new THREE.SphereGeometry(.425,28,20),black,new THREE.Vector3(0,.01,.015),hair).scale.set(1.02,1.0,.92);
  const hairSpikes=[];
  for(let i=0;i<28;i++){
    const a=(i/28)*Math.PI*2;
    const top=i<10;
    const len=top?.46+(i%4)*.08:.34+(i%5)*.065;
    const s=M(new THREE.ConeGeometry(.055,.52,6),black,new THREE.Vector3(Math.cos(a)*.27,.16+Math.sin(a)*.05,Math.sin(a)*.23),hair);
    s.scale.y=len/.52;
    s.rotation.z=Math.cos(a)*(.55+.18*(i%3));
    s.rotation.x=-Math.sin(a)*(.65+.12*(i%2));
    hairSpikes.push(s);
  }
  // Front hair strands.
  for(let i=0;i<7;i++){
    const s=M(new THREE.ConeGeometry(.038,.34+(i%3)*.07,5),black,new THREE.Vector3((i-3)*.075,.17,-.31),hair);
    s.rotation.z=(i-3)*.18;
    s.rotation.x=.42;
    hairSpikes.push(s);
  }

  // Shoulders / layered silver-blue armor.
  const makeArm=(side)=>{
    const x=side*.66;
    const shoulder=G(`shoulder-${side<0?'L':'R'}`,new THREE.Vector3(x,1.72,0));
    const sh=M(new THREE.SphereGeometry(.29,20,14),silver,new THREE.Vector3(),shoulder);
    sh.scale.set(1.38,.78,1.16);
    M(new THREE.SphereGeometry(.20,16,12),darkMetal,new THREE.Vector3(0,-.02,-.05),shoulder).scale.set(1.2,.65,1.1);
    M(new THREE.OctahedronGeometry(.085,1),blue,new THREE.Vector3(0,-.01,-.28),shoulder);

    const upper=G(`upper-arm-${side<0?'L':'R'}`,new THREE.Vector3(0,-.10,0),shoulder);
    M(new THREE.CapsuleGeometry(.145,.55,8,12),fabric2,new THREE.Vector3(0,-.34,0),upper);
    const elbow=G(`elbow-${side<0?'L':'R'}`,new THREE.Vector3(0,-.68,0),upper);
    box(.27,.20,.30,black,new THREE.Vector3(),elbow);
    const fore=G(`forearm-${side<0?'L':'R'}`,new THREE.Vector3(0,-.10,0),elbow);
    M(new THREE.CapsuleGeometry(.135,.52,8,12),fabric2,new THREE.Vector3(0,-.30,0),fore);
    box(.19,.07,.06,blue,new THREE.Vector3(0,-.58,-.17),fore);

    const hand=G(`hand-${side<0?'L':'R'}`,new THREE.Vector3(0,-.63,0),fore);
    M(new THREE.SphereGeometry(.16,16,12),skin,new THREE.Vector3(0,-.07,0),hand);
    // Finger armor / glove plates.
    for(let i=0;i<5;i++){
      const finger=G(`finger-${side<0?'L':'R'}-${i+1}`,new THREE.Vector3((i-2)*.045,-.17,-.08),hand);
      M(new THREE.CapsuleGeometry(.024,.115,5,7),black,new THREE.Vector3(0,-.06,0),finger);
      box(.034,.045,.026,blue,new THREE.Vector3(0,-.10,-.015),finger);
      if(!hand.userData.fingers) hand.userData.fingers=[];
      hand.userData.fingers.push(finger);
    }
    box(.27,.12,.34,black,new THREE.Vector3(0,-.10,-.03),hand);
    box(.09,.05,.08,blue,new THREE.Vector3(0,-.14,-.20),hand);
    return {arm:upper,shoulder,hand,fingers:hand.userData.fingers};
  };
  const Larm=makeArm(-1), Rarm=makeArm(1);
  const shoulders=[Larm.shoulder,Rarm.shoulder];

  // Tactical pants with layered cargo panels and blue side strips.
  const makeLeg=(side)=>{
    const x=side*.22;
    const thigh=G(`thigh-${side<0?'L':'R'}`,new THREE.Vector3(x,.92,0));
    M(new THREE.CapsuleGeometry(.18,.68,8,12),black,new THREE.Vector3(0,-.38,0),thigh);
    box(.27,.36,.08,fabric2,new THREE.Vector3(side*.025,-.30,-.17),thigh);
    box(.18,.32,.05,black,new THREE.Vector3(side*.09,-.43,-.20),thigh);
    const knee=G(`knee-${side<0?'L':'R'}`,new THREE.Vector3(0,-.76,-.02),thigh);
    box(.35,.23,.34,darkMetal,new THREE.Vector3(0,0,-.14),knee);
    box(.13,.07,.05,blue,new THREE.Vector3(0,-.01,-.32),knee);
    const shin=G(`shin-${side<0?'L':'R'}`,new THREE.Vector3(0,-.11,0),knee);
    M(new THREE.CapsuleGeometry(.17,.70,8,12),black,new THREE.Vector3(0,-.38,0),shin);
    box(.20,.46,.07,fabric2,new THREE.Vector3(0,-.38,-.16),shin);
    const boot=G(`boot-${side<0?'L':'R'}`,new THREE.Vector3(0,-.79,-.07),shin);
    box(.43,.29,.76,black,new THREE.Vector3(0,-.08,-.10),boot);
    box(.46,.065,.12,blue,new THREE.Vector3(0,-.12,-.47),boot);
    box(.32,.07,.10,silver,new THREE.Vector3(0,.02,-.49),boot);
    box(.12,.12,.16,blue2,new THREE.Vector3(side*.15,-.08,-.47),boot);
    return {leg:thigh,boot};
  };
  const Lleg=makeLeg(-1),Rleg=makeLeg(1);

  // Long asymmetric white/black coat with blue luminous inner panels.
  const coatL=M(new THREE.BoxGeometry(.56,1.50,.13),white,new THREE.Vector3(-.32,1.00,.34));
  const coatR=M(new THREE.BoxGeometry(.56,1.50,.13),white,new THREE.Vector3(.32,1.00,.34));
  coatL.rotation.z=-.065; coatR.rotation.z=.065;
  box(.42,1.30,.06,black,new THREE.Vector3(-.30,1.01,.27));
  box(.42,1.30,.06,black,new THREE.Vector3(.30,1.01,.27));
  box(.07,1.35,.035,blue2,new THREE.Vector3(-.60,1.00,.27));
  box(.07,1.35,.035,blue2,new THREE.Vector3(.60,1.00,.27));
  // Coat tails / pointed silhouette.
  for(const side of [-1,1]){
    const tail=M(new THREE.ConeGeometry(.28,.82,4),white,new THREE.Vector3(side*.30,.35,.37));
    tail.rotation.z=side*.08;
    tail.rotation.x=Math.PI;
  }

  // High collar and shoulder straps.
  box(.18,.48,.16,black,new THREE.Vector3(-.30,1.88,-.02)).rotation.z=-.20;
  box(.18,.48,.16,black,new THREE.Vector3(.30,1.88,-.02)).rotation.z=.20;
  box(.08,.72,.05,white,new THREE.Vector3(-.43,1.48,-.47)).rotation.z=-.12;
  box(.08,.72,.05,white,new THREE.Vector3(.43,1.48,-.47)).rotation.z=.12;

  // Backpack and rear luminous spine.
  const backpack=box(.76,.94,.32,black,new THREE.Vector3(0,1.43,.43));
  box(.40,.10,.07,blue,new THREE.Vector3(0,1.56,.61));
  box(.10,.66,.06,blue2,new THREE.Vector3(-.20,1.43,.60));
  box(.10,.66,.06,blue2,new THREE.Vector3(.20,1.43,.60));

  // Belts, hanging straps and chains.
  for(const side of [-1,1]){
    box(.08,.62,.04,black,new THREE.Vector3(side*.43,.86,-.40)).rotation.z=side*.12;
    for(let i=0;i<3;i++){
      const link=M(new THREE.TorusGeometry(.045,.012,6,10),silver,new THREE.Vector3(side*(.46+.02*(i%2)),.78-i*.09,-.44));
      link.rotation.x=Math.PI/2;
    }
  }

  // Back-mounted sword with blue wrapped grip, guard and emissive blade.
  const sword=G('sword',new THREE.Vector3(.43,1.65,.42));
  sword.rotation.z=-.22;
  box(.15,1.48,.14,black,new THREE.Vector3(0,.18,0),sword);
  box(.085,1.26,.065,blue,new THREE.Vector3(0,.72,-.01),sword);
  box(.34,.08,.09,silver,new THREE.Vector3(0,-.55,0),sword);
  box(.08,.30,.08,blue2,new THREE.Vector3(0,-.73,0),sword);
  box(.06,.08,.05,blue,new THREE.Vector3(0,.15,-.08),sword);

  // Explicit part map preserves compatibility with animator and avatar-style system.
  player.group.userData.parts={
    la:Larm.arm,ra:Rarm.arm,ll:Lleg.leg,rl:Rleg.leg,
    torso,head,bootL:Lleg.boot,bootR:Rleg.boot,backpack,
    accent:core,coatL,coatR,sword,visorGlow,chestCore:core,
    coatHemL:coatL,coatHemR:coatR,hands:[Larm.hand,Rarm.hand],
    fingers:[...Larm.fingers,...Rarm.fingers],eyes:[eyeL,eyeR],shoulders,
    hips,hairSpikes,microDetails:{eyeL,eyeR,hairSpikes},
    shoulderLightL:Larm.shoulder,shoulderLightR:Rarm.shoulder,
    seamL:coatL,seamR:coatR,backpackLight:blue,
    energyNodes:[core]
  };

  player.group.add(body);
  player.group.position.copy(player.pos);
  scene.add(player.group);
}
