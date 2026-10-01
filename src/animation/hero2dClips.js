// NEXUS Hero 2D motion clips. Pure data so Android can render without asset loading.
const EASE = (t) => t * t * (3 - 2 * t);
export const HERO_2D_CLIPS = {
  IDLE: { duration: 2.4, loop: true, pose: (p, t) => ({ breath: Math.sin(t * Math.PI * 2 / 2.4) * 0.025, arm: 0.035 * Math.sin(t * 1.7), leg: 0.01 * Math.sin(t * 1.3), lean: 0.012 * Math.sin(t * 1.1), look: 0.035 * Math.sin(t * 0.7) }) },
  WALK: { duration: 0.72, loop: true, pose: (p, t) => { const q = t * Math.PI * 2 / 0.72; return { breath: 0.01, arm: 0.38 * Math.sin(q), armR: -0.38 * Math.sin(q), leg: 0.52 * Math.sin(q), legR: -0.52 * Math.sin(q), lean: 0.018 }; } },
  RUN: { duration: 0.48, loop: true, pose: (p, t) => { const q = t * Math.PI * 2 / 0.48; return { breath: 0.008, arm: 0.62 * Math.sin(q), armR: -0.62 * Math.sin(q), leg: 0.78 * Math.sin(q), legR: -0.78 * Math.sin(q), lean: -0.055 }; } },
  TURN: { duration: 0.34, loop: false, pose: (p, t) => { const q = EASE(Math.min(1, t / 0.34)); return { breath: 0.01, arm: -0.18 + 0.42 * q, armR: 0.28 - 0.16 * q, leg: 0.14 - 0.24 * q, legR: -0.12 + 0.08 * q, lean: -0.075, torsoTwist: 0.12 * q }; } },
  STOP: { duration: 0.22, loop: false, pose: (p, t) => { const q = EASE(Math.min(1, t / 0.22)); return { breath: 0.01, arm: 0.2 * (1 - q), armR: 0.2 * (1 - q), leg: -0.22 * (1 - q), legR: -0.22 * (1 - q), lean: 0.035 * (1 - q) }; } },
  JUMP: { duration: 0.68, loop: false, pose: (p, t) => { const q = Math.min(1, t / 0.68); const arc = Math.sin(Math.PI * q); return { breath: 0, arm: -0.14 + 0.22 * arc, armR: -0.14 + 0.18 * arc, leg: -0.2 + 0.18 * arc, legR: -0.2 + 0.18 * arc, lean: -0.025 * arc, jumpY: arc * 0.16 }; } },
  LANDING: { duration: 0.20, loop: false, pose: (p, t) => { const q = EASE(Math.min(1, t / 0.20)); return { breath: 0, arm: 0.18 * (1 - q), armR: 0.18 * (1 - q), leg: -0.22 * (1 - q), legR: -0.22 * (1 - q), lean: 0.035 * (1 - q), squash: 1 - 0.16 * Math.sin(Math.PI * q) }; } },
  INTERACT: { duration: 0.64, loop: false, pose: (p, t) => { const q = EASE(Math.min(1, t / 0.64)); return { breath: 0.01, arm: -0.15 - 0.25 * Math.sin(Math.PI * q), armR: 0.08, leg: 0.03, legR: -0.03, lean: -0.02, pulse: Math.sin(Math.PI * q) }; } }
};
export function clipPose(name, phaseSeconds, prevName = name, blend = 1) {
  const a = HERO_2D_CLIPS[name] || HERO_2D_CLIPS.IDLE;
  const b = a.pose({}, phaseSeconds);
  if (prevName === name || blend >= 1) return b;
  const previous = HERO_2D_CLIPS[prevName] || HERO_2D_CLIPS.IDLE;
  const pa = previous.pose({}, Math.min(phaseSeconds, previous.duration));
  const k = EASE(Math.max(0, Math.min(1, blend)));
  const out = {};
  const keys = new Set([...Object.keys(pa), ...Object.keys(b)]);
  keys.forEach((key) => out[key] = (pa[key] || 0) + ((b[key] || 0) - (pa[key] || 0)) * k);
  return out;
}
