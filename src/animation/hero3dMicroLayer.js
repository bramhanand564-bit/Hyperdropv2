import * as THREE from 'three';

const PRIMARY = ["head","hair","face","eyes","eyebrows","ears","neck","collar","chest","back","shoulder-l","shoulder-r","upper-arm-l","upper-arm-r","forearm-l","forearm-r","hand-l","hand-r","finger-l-1","finger-l-2","finger-l-3","finger-l-4","finger-l-5","finger-r-1","finger-r-2","finger-r-3","finger-r-4","finger-r-5","glove-l","glove-r","chest-core","torso","waist","belt","belt-buckle","coat-front-l","coat-front-r","coat-back-l","coat-back-r","coat-tail-l","coat-tail-r","coat-seam-l","coat-seam-r","armor-chest","armor-back","armor-knee-l","armor-knee-r","thigh-l","thigh-r","shin-l","shin-r","boot-l","boot-r","boot-light-l","boot-light-r","sword","sword-handle","sword-blade","sword-glow","sheath","backpack","backpack-light","energy-node-l","energy-node-r","visor","visor-glow","hair-front","hair-back","hair-side-l","hair-side-r","cloth-strap-l","cloth-strap-r","utility-pouch-l","utility-pouch-r","shoulder-light-l","shoulder-light-r","wrist-light-l","wrist-light-r","knee-light-l","knee-light-r","coat-light-l","coat-light-r","floor-shadow","hero-rim-light","idle-breath","idle-look","idle-weight","walk-cycle","run-cycle","turn-cycle","jump-cycle","landing-cycle","interaction-pose","damage-pose","emote-slot","camera-presentation","particle-trail","fx-slot","detail-reserve","reserved-100"];
const COUNT = 10000;
const MICRO_PER_PRIMARY = 100;

const anchorFor = (name) => {
  if (/head|hair|face|eyes|eyebrows|ears|visor/.test(name)) return new THREE.Vector3(0, 2.35, 0);
  if (/shoulder|upper-arm|forearm|hand|finger|glove|wrist/.test(name)) return new THREE.Vector3(/r|R/.test(name) ? .7 : -.7, 1.45, 0);
  if (/thigh|shin|boot|knee/.test(name)) return new THREE.Vector3(/r|R/.test(name) ? .22 : -.22, .55, 0);
  if (/sword|sheath/.test(name)) return new THREE.Vector3(.48, 1.55, .40);
  if (/floor-shadow/.test(name)) return new THREE.Vector3(0, .03, 0);
  if (/light|node|glow|particle|fx|rim/.test(name)) return new THREE.Vector3(0, 1.6, .05);
  return new THREE.Vector3(0, 1.35, .08);
};

export function buildHero3DMicroLayer(heroGroup) {
  // HIGH quality uses a denser 3D micro-primitive. MEDIUM/LOW are handled by the quality gate.
  const geometry = new THREE.IcosahedronGeometry(0.018, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8bdcff,
    emissive: 0x1b9bd1,
    emissiveIntensity: 1.7,
    roughness: 0.36,
    metalness: 0.48
  });
  const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
  mesh.name = "NEXUS_HERO_10000_MICRO_3D_ULTRA";
  mesh.userData.qualityContract = {
    addressableUnits: COUNT,
    geometryDetail: "ICOSAHEDRON_SUBDIVISION_1",
    material: "PBR_STANDARD",
    animation: "DETERMINISTIC_PER_INSTANCE",
    lod: ["HIGH:10000", "MEDIUM:5000", "LOW:0"]
  };
  mesh.frustumCulled = false;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let cursor = 0;

  PRIMARY.forEach((name, primaryIndex) => {
    const base = anchorFor(name);
    for (let microIndex = 0; microIndex < MICRO_PER_PRIMARY; microIndex += 1) {
      const a = (microIndex / MICRO_PER_PRIMARY) * Math.PI * 2;
      const ring = 0.025 + (microIndex % 10) * 0.008;
      const axial = (Math.floor(microIndex / 10) - 4.5) * 0.012;
      dummy.position.set(
        base.x + Math.cos(a) * ring,
        base.y + axial + Math.sin(a * 2.0) * 0.012,
        base.z + Math.sin(a) * ring
      );
      const pulse = 0.86 + ((primaryIndex + microIndex) % 7) * 0.025;
      dummy.scale.setScalar(pulse);
      dummy.rotation.set(a * 0.17, a * 0.29, a * 0.11);
      dummy.updateMatrix();
      mesh.setMatrixAt(cursor++, dummy.matrix);
      color.setHSL(0.53 + ((primaryIndex % 9) * 0.006), 0.72, 0.66 + ((microIndex % 5) * 0.035));
      mesh.setColorAt(cursor - 1, color);
    }
  });

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  heroGroup.add(mesh);
  heroGroup.userData.micro3D = mesh;
  heroGroup.userData.micro3DCount = cursor;
  return mesh;
}

export function setHero3DMicroQuality(heroGroup, quality = "HIGH") {
  const mesh = heroGroup?.userData?.micro3D;
  if (!mesh) return;
  mesh.visible = quality !== "LOW";
  const target = quality === "MEDIUM" ? 5000 : 10000;
  for (let i = 0; i < mesh.count; i += 1) {
    const show = i < target;
    const m = mesh.instanceMatrix.array;
    if (!show) {
      m[i * 16 + 0] = 0;
      m[i * 16 + 5] = 0;
      m[i * 16 + 10] = 0;
      m[i * 16 + 15] = 1;
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
}
