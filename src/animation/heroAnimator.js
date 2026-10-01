import * as THREE from 'three';

export function updateHeroMicroAnimation(player, dt, timeMs, moving, sprinting) {
  const p = player.group?.userData?.parts;
  if (!p) return;
  const t = timeMs * 0.001;
  const phase = player.walkPhase || 0;
  const speed = moving ? (sprinting ? 1.65 : 1) : 0.45;
  const smooth = (current, target, rate) => THREE.MathUtils.lerp(current, target, Math.min(1, dt * rate));

  // Locomotion state machine: IDLE -> WALK -> RUN, plus JUMP/LANDING.
  const airborne = !player.grounded;
  const wasAirborne = !!player.__heroWasAirborne;
  const wasMoving = !!player.__heroWasMoving;
  const previousYaw = player.__heroYaw ?? player.group.rotation.y;
  const yawDelta = Math.abs(THREE.MathUtils.euclideanModulo(player.group.rotation.y - previousYaw + Math.PI, Math.PI * 2) - Math.PI);
  const turning = moving && yawDelta > 0.045;
  let nextState = airborne ? 'JUMP' : (wasAirborne ? 'LANDING' : turning ? 'TURN' : (!moving && wasMoving ? 'STOP' : moving ? (sprinting ? 'RUN' : 'WALK') : 'IDLE'));
  if (wasAirborne && !airborne) nextState = 'LANDING';
  if (player.__heroState === 'LANDING' && !airborne) {
    player.__heroLandingTime = (player.__heroLandingTime || 0) + dt;
    if (player.__heroLandingTime > 0.16) nextState = moving ? (sprinting ? 'RUN' : 'WALK') : 'IDLE';
  } else if (nextState !== 'LANDING') player.__heroLandingTime = 0;
  player.__heroState = nextState;
  player.__heroWasAirborne = airborne;
  player.__heroWasMoving = moving;
  player.__heroYaw = player.group.rotation.y;

  const gait = nextState === 'RUN' ? 1.55 : nextState === 'WALK' ? 1 : 0.55;

  if (p.eyes) {
    const blink = Math.sin(t * 1.17 + 0.8) > 0.985 ? 0.08 : 1;
    p.eyes.forEach((eye, i) => {
      eye.scale.y = smooth(eye.scale.y, blink, 18);
      eye.position.y += Math.sin(t * 0.9 + i) * 0.00025;
    });
  }

  if (p.hairSpikes) p.hairSpikes.forEach((spike, i) => {
    const target = Math.sin(t * (1.7 + (i % 3) * 0.15) + i * 0.47) * 0.025 * speed;
    spike.rotation.z = smooth(spike.rotation.z, target, 7);
    spike.rotation.x = smooth(spike.rotation.x, -target * 0.7, 6);
  });

  // Walk/run gait with distinct stride amplitude and counter-swing.
  if (p.la && p.ra && p.ll && p.rl) {
    const stride = nextState === 'RUN' ? 0.78 : nextState === 'WALK' ? 0.52 : 0.08;
    const armSwing = nextState === 'RUN' ? 0.72 : nextState === 'WALK' ? 0.5 : 0.05;
    const phaseLead = phase * gait;
    if (nextState === 'JUMP') {
      p.la.rotation.x = smooth(p.la.rotation.x, -0.12, 9);
      p.ra.rotation.x = smooth(p.ra.rotation.x, -0.12, 9);
      p.ll.rotation.x = smooth(p.ll.rotation.x, -0.18, 9);
      p.rl.rotation.x = smooth(p.rl.rotation.x, -0.18, 9);
    } else if (nextState === 'LANDING' || nextState === 'STOP') {
      p.la.rotation.x = smooth(p.la.rotation.x, 0.18, 14);
      p.ra.rotation.x = smooth(p.ra.rotation.x, 0.18, 14);
      p.ll.rotation.x = smooth(p.ll.rotation.x, -0.22, 14);
      p.rl.rotation.x = smooth(p.rl.rotation.x, -0.22, 14);
    } else if (nextState === 'TURN') {
      p.la.rotation.x = smooth(p.la.rotation.x, -0.22, 10);
      p.ra.rotation.x = smooth(p.ra.rotation.x, 0.34, 10);
      p.ll.rotation.x = smooth(p.ll.rotation.x, 0.18, 10);
      p.rl.rotation.x = smooth(p.rl.rotation.x, -0.12, 10);
    } else {
      const armL = Math.sin(phaseLead) * armSwing;
      const legL = Math.sin(phaseLead) * stride;
      p.la.rotation.x = smooth(p.la.rotation.x, armL, 14);
      p.ra.rotation.x = smooth(p.ra.rotation.x, -armL, 14);
      p.ll.rotation.x = smooth(p.ll.rotation.x, -legL, 14);
      p.rl.rotation.x = smooth(p.rl.rotation.x, legL, 14);
    }
  }

  // Turn/stop response.
  if (p.torso) {
    const lean = nextState === 'RUN' ? -0.055 : nextState === 'TURN' ? -0.075 : nextState === 'STOP' || nextState === 'LANDING' ? 0.035 : moving ? -0.022 : 0;
    const breath = Math.sin(t * 2.15) * (moving ? 0.012 : 0.02);
    p.torso.rotation.z = smooth(p.torso.rotation.z, lean + breath, 7);
    const targetY = nextState === 'LANDING' ? 0.96 : nextState === 'JUMP' ? 1.025 : 1 + breath;
    p.torso.scale.y = smooth(p.torso.scale.y, targetY, nextState === 'LANDING' ? 16 : 8);
  }
  if (p.head) {
    const look = moving ? Math.sin(phase * 0.35) * 0.035 : Math.sin(t * 0.7) * 0.045;
    p.head.rotation.y = smooth(p.head.rotation.y, look, 5);
  }
  if (p.hips) {
    const weight = nextState === 'TURN' ? 0.045 : moving ? Math.sin(phase * 0.5) * 0.025 : Math.sin(t * 1.7) * 0.012;
    p.hips.rotation.z = smooth(p.hips.rotation.z, weight, 6);
  }
  if (Array.isArray(p.shoulders)) p.shoulders.forEach((shoulder, i) => {
    const target = moving ? (i ? -1 : 1) * Math.sin(phase * 0.5) * 0.035 : Math.sin(t * 1.2 + i) * 0.008;
    shoulder.rotation.z = smooth(shoulder.rotation.z, target, 7);
  });

  if (p.fingers) p.fingers.forEach((finger, i) => {
    const target = moving ? Math.sin(phase * gait + i * 0.38) * (nextState === 'RUN' ? 0.1 : 0.07) : Math.sin(t * 1.3 + i * 0.31) * 0.025;
    finger.rotation.x = smooth(finger.rotation.x, target, 10);
  });

  if (p.coatL && p.coatR) {
    const sway = Math.sin(phase * gait * 0.72) * 0.055 * speed;
    p.coatL.rotation.x = smooth(p.coatL.rotation.x, sway, 5);
    p.coatR.rotation.x = smooth(p.coatR.rotation.x, -sway, 5);
  }

  if (p.chestCore) {
    const pulse = 1 + Math.sin(t * (moving ? 5.5 : 2.4)) * (moving ? 0.07 : 0.045);
    if (!player.__heroCoreScale) player.__heroCoreScale = new THREE.Vector3(1, 1, 1);
    player.__heroCoreScale.set(pulse, pulse, pulse);
    p.chestCore.scale.lerp(player.__heroCoreScale, Math.min(1, dt * 8));
  }

  if (p.bootL && p.bootR) {
    const foot = nextState === 'RUN' ? Math.sin(phase * gait) * 0.11 : nextState === 'WALK' ? Math.sin(phase * gait) * 0.06 : nextState === 'LANDING' ? -0.08 : 0;
    p.bootL.rotation.x = smooth(p.bootL.rotation.x, foot, 10);
    p.bootR.rotation.x = smooth(p.bootR.rotation.x, -foot, 10);
  }

  if (p.sword) {
    const swordTarget = nextState === 'RUN' ? -0.27 + Math.sin(phase * 0.55) * 0.07 : moving ? -0.24 + Math.sin(phase * 0.55) * 0.045 : -0.22 + Math.sin(t * 1.2) * 0.012;
    p.sword.rotation.z = smooth(p.sword.rotation.z, swordTarget, 5);
    p.sword.rotation.x = smooth(p.sword.rotation.x, moving ? Math.cos(phase) * 0.018 : 0, 5);
  }

  if (p.hands) p.hands.forEach((hand, i) => {
    const target = moving ? Math.sin(phase + i * Math.PI) * 0.055 : Math.sin(t * 1.1 + i) * 0.018;
    hand.rotation.z = smooth(hand.rotation.z, target, 8);
  });
}
