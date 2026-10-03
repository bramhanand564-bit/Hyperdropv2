#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const names=["head","hair","face","eyes","eyebrows","ears","neck","collar","chest","back","shoulder-l","shoulder-r","upper-arm-l","upper-arm-r","forearm-l","forearm-r","hand-l","hand-r","finger-l-1","finger-l-2","finger-l-3","finger-l-4","finger-l-5","finger-r-1","finger-r-2","finger-r-3","finger-r-4","finger-r-5","glove-l","glove-r","chest-core","torso","waist","belt","belt-buckle","coat-front-l","coat-front-r","coat-back-l","coat-back-r","coat-tail-l","coat-tail-r","coat-seam-l","coat-seam-r","armor-chest","armor-back","armor-knee-l","armor-knee-r","thigh-l","thigh-r","shin-l","shin-r","boot-l","boot-r","boot-light-l","boot-light-r","sword","sword-handle","sword-blade","sword-glow","sheath","backpack","backpack-light","energy-node-l","energy-node-r","visor","visor-glow","hair-front","hair-back","hair-side-l","hair-side-r","cloth-strap-l","cloth-strap-r","utility-pouch-l","utility-pouch-r","shoulder-light-l","shoulder-light-r","wrist-light-l","wrist-light-r","knee-light-l","knee-light-r","coat-light-l","coat-light-r","floor-shadow","hero-rim-light","idle-breath","idle-look","idle-weight","walk-cycle","run-cycle","turn-cycle","jump-cycle","landing-cycle","interaction-pose","damage-pose","emote-slot","camera-presentation","particle-trail","fx-slot","detail-reserve","reserved-100"];
const root=path.resolve("animation/characters/nexus-hero");
if(names.length!==100) throw new Error("Registry must contain exactly 100 primary modules");
const spec=JSON.stringify({
  version:2, dimension:"3D", character:"nexus-hero",
  microCount:100, addressing:"primary-folder + micro-file index",
  geometry:"procedural-instanced", mobile:"single runtime instanced layer"
},null,2)+"\n";
for(let i=1;i<=100;i++){
  const dir=path.join(root,String(i).padStart(3,"0")+"-"+names[i-1]);
  fs.mkdirSync(dir,{recursive:true});
  for(let j=1;j<=100;j++){
    const stem=String(j).padStart(3,"0");
    const f=path.join(dir,stem+"-micro-module.json");
    const legacy=path.join(dir,stem+"-micro-module.md");
    if(!fs.existsSync(f)) fs.writeFileSync(f,spec);
    if(fs.existsSync(legacy)) fs.unlinkSync(legacy);
  }
}
console.log("100 primary × 100 micro = 10,000 3D micro-module specs");
