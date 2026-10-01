import * as THREE from 'three';

/**
 * NEXUS Hero micro-animation controller.
 * Runtime layer for the locked 100×100 module architecture.
 * It deliberately animates only addressable rig nodes; gameplay stays separate.
 */
export function updateHeroMicroAnimation(player, dt, timeMs, moving, sprinting) {
  const p = player.group?.userData?.parts;
  if (!p) return;

  const t = timeMs * 0.001;
  const speed = moving ? (sprinting ? 1.65 : 1) : 0.45;
  const phase = player.walkPhase;

  // Face / eyes: tiny focus movement instead of a static head.
  if (p.eyes) {
    const blink = Math.sin(t * 1.17 + 0.8) > 0.985 ? 0.08 : 1;
    p.eyes.forEach((eye, i) => {
      eye.scale.y = THREE.MathUtils.lerp(eye.scale.y, blink, Math.min(1, dt * 18));
      eye.position.y += Math.sin(t * 0.9 + i) * 0.00025;
    });
  }

  // Hair: secondary spring-like motion.
  if (p.hairSpikes) {
    p.hairSpikes.forEach((spike, i) => {
      const target = Math.sin(t * (1.7 + (i % 3) * 0.15) + i * 0.47) * 0.025 * speed;
      spike.rotation.z = THREE.MathUtils.lerp(spike.rotation.z, target, Math.min(1, dt * 7));
      spike.rotation.x = THREE.MathUtils.lerp(spike.rotation.x, -target * 0.7, Math.min(1, dt * 6));
    });
  }

  // Fingers: each digit has its own phase.
  if (p.fingers) {
    p.fingers.forEach((finger, i) => {
      const target = moving
        ? Math.sin(phase * 1.05 + i * 0.38) * 0.08
        : Math.sin(t * 1.3 + i * 0.31) * 0.025;
      finger.rotation.x = THREE.MathUtils.lerp(finger.rotation.x, target, Math.min(1, dt * 10));
    });
  }

  // Coat tails: delayed secondary motion.
  if (p.coatL && p.coatR) {
    const sway = Math.sin(phase * 0.72) * 0.055 * speed;
    p.coatL.rotation.x = THREE.MathUtils.lerp(p.coatL.rotation.x, sway, Math.min(1, dt * 5));
    p.coatR.rotation.x = THREE.MathUtils.lerp(p.coatR.rotation.x, -sway, Math.min(1, dt * 5));
  }

  // Energy core: breathing/power pulse.
  if (p.chestCore) {
    const pulse = 1 + Math.sin(t * (moving ? 5.5 : 2.4)) * (moving ? 0.07 : 0.045);
    p.chestCore.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), Math.min(1, dt * 8));
  }

  // Subtle boot lift gives the stride more weight.
  if (moving && p.bootL && p.bootR) {
    const foot = Math.sin(phase) * 0.035;
    p.bootL.rotation.x = THREE.MathUtils.lerp(p.bootL.rotation.x, foot, Math.min(1, dt * 8));
    p.bootR.rotation.x = THREE.MathUtils.lerp(p.bootR.rotation.x, -foot, Math.min(1, dt * 8));
  }
}
