import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('animation/characters/nexus-hero');
const primary = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory());
const microCounts = primary.map((dir) => ({
  name: dir.name,
  count: fs.readdirSync(path.join(root, dir.name), { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.json')).length
}));
const totalMicro = microCounts.reduce((sum, item) => sum + item.count, 0);
if (primary.length !== 100) throw new Error('Expected 100 primary animation part folders, found ' + primary.length);
if (microCounts.some((item) => item.count !== 100)) {
  const bad = microCounts.filter((item) => item.count !== 100).slice(0, 8);
  throw new Error('Expected 100 JSON micro modules per part: ' + JSON.stringify(bad));
}
for (const dir of primary) {
  const files = fs.readdirSync(path.join(root, dir.name)).filter((name) => name.endsWith('.json'));
  if (files.length !== 100) throw new Error('3D micro-module count mismatch in ' + dir.name);
}
const registry = JSON.parse(fs.readFileSync(path.resolve('animation/characters/nexus-hero/character-100x100.json'), 'utf8'));
if (registry.primaryCount !== 100 || registry.microCountPerPrimary !== 100 || registry.totalMicroModules !== 10000) {
  throw new Error('3D 100×100 registry metadata is invalid');
}
const microLayerText = fs.readFileSync(path.resolve('src/animation/hero3dMicroLayer.js'), 'utf8');
if (!microLayerText.includes('InstancedMesh') || !microLayerText.includes('10000')) {
  throw new Error('10,000-instance 3D micro layer missing');
}
const clipText = fs.readFileSync(path.resolve('src/animation/hero2dClips.js'), 'utf8');
const expectedClips = ['IDLE','WALK','RUN','TURN','STOP','JUMP','LANDING','INTERACT'];
for (const name of expectedClips) {
  if (!clipText.includes(name + ':')) throw new Error('Missing 2D clip ' + name);
}
console.log('NEXUS 3D 100×100 animation architecture OK');
console.log('Primary parts:', primary.length);
console.log('3D micro modules:', totalMicro);
console.log('2D preview clips:', expectedClips.length);
