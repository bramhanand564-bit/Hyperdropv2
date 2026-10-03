import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const DEFAULT_PATH = './assets/characters/nexus-hero.glb';

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

    player.group.clear();
    player.group.add(model);
    player.group.userData.gltf = model;
    player.group.userData.gltfAnimations = gltf.animations || [];
    player.group.userData.parts = {
      torso: model, head: model, la: model, ra: model, ll: model, rl: model,
      backpack: model, accent: model, visorGlow: model, chestCore: model,
      shoulderLightL: model, shoulderLightR: model, seamL: model, seamR: model,
      backpackLight: model, energyNodes: [model]
    };
    player.group.position.copy(player.pos);
    scene.add(player.group);
    return { model, animations: gltf.animations || [], source: 'GLB' };
  } catch (error) {
    console.warn('[NEXUS] GLB unavailable; using procedural fallback.', error);
    if (fallbackBuilder) {
      fallbackBuilder({ scene, player, mat });
      return { model: player.group, animations: [], source: 'FALLBACK' };
    }
    throw error;
  }
}
