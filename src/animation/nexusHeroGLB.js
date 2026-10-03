import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const DEFAULT_PATH = './assets/characters/nexus-hero.glb';

function inertPart(name) {
  const node = new THREE.Object3D();
  node.name = 'GLB_PART_PLACEHOLDER_' + name;
  return node;
}

function makeGLBPartContract() {
  return {
    torso: inertPart('torso'),
    head: inertPart('head'),
    la: inertPart('la'),
    ra: inertPart('ra'),
    ll: inertPart('ll'),
    rl: inertPart('rl'),
    bootL: inertPart('bootL'),
    bootR: inertPart('bootR'),
    backpack: inertPart('backpack'),
    accent: inertPart('accent'),
    visorGlow: inertPart('visorGlow'),
    chestCore: inertPart('chestCore'),
    coatL: inertPart('coatL'),
    coatR: inertPart('coatR'),
    coatHemL: inertPart('coatHemL'),
    coatHemR: inertPart('coatHemR'),
    sword: inertPart('sword'),
    hips: inertPart('hips'),
    hands: [inertPart('handL'), inertPart('handR')],
    fingers: Array.from({ length: 10 }, (_, i) => inertPart('finger' + i)),
    eyes: [inertPart('eyeL'), inertPart('eyeR')],
    shoulders: [inertPart('shoulderL'), inertPart('shoulderR')],
    hairSpikes: [],
    shoulderLightL: inertPart('shoulderLightL'),
    shoulderLightR: inertPart('shoulderLightR'),
    seamL: inertPart('seamL'),
    seamR: inertPart('seamR'),
    backpackLight: inertPart('backpackLight'),
    energyNodes: [inertPart('energyNode')]
  };
}

export async function loadNexusHeroGLB({ scene, player, path = DEFAULT_PATH, fallbackBuilder, mat } = {}) {
  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync(path);
    const model = gltf.scene;
    model.name = 'NEXUS_HERO_GLB';
    model.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = false;
      node.receiveShadow = false;
      if (node.material) {
        node.material.needsUpdate = true;
        if (node.material.map) node.material.map.colorSpace = THREE.SRGBColorSpace;
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const height = Math.max(0.001, box.max.y - box.min.y);
    model.scale.setScalar(2.85 / height);
    const normalized = new THREE.Box3().setFromObject(model);
    model.position.y -= normalized.min.y;

    const animations = gltf.animations || [];
    const mixer = animations.length ? new THREE.AnimationMixer(model) : null;
    if (mixer) {
      const preferred = animations.find((clip) => /idle|stand/i.test(clip.name)) || animations[0];
      mixer.clipAction(preferred).play();
    }

    player.group.clear();
    player.group.add(model);
    player.group.userData.gltf = model;
    player.group.userData.gltfAnimations = animations;
    player.group.userData.gltfMixer = mixer;
    player.group.userData.parts = makeGLBPartContract();
    player.group.position.copy(player.pos);
    scene.add(player.group);
    return { model, animations, mixer, source: 'GLB' };
  } catch (error) {
    console.warn('[NEXUS] GLB unavailable; using procedural fallback.', error);
    if (fallbackBuilder) {
      fallbackBuilder({ scene, player, mat });
      return { model: player.group, animations: [], mixer: null, source: 'FALLBACK' };
    }
    throw error;
  }
}
