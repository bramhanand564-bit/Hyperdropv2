import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('animation/characters/nexus-hero');
const primary = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory());
const microCounts = primary.map((dir) => ({
  name: dir.name,
  count: fs.readdirSync(path.join(root, dir.name), { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.md')).length
}));
const totalMicro = microCounts.reduce((sum, item) => sum + item.count, 0);
if (primary.length !== 100) throw new Error('Expected 100 primary animation part folders, found ' + primary.length);
if (microCounts.some((item) => item.count !== 100)) {
  const bad = microCounts.filter((item) => item.count !== 100).slice(0, 8);
  throw new Error('Expected 100 micro modules per part: ' + JSON.stringify(bad));
}
const clipText = fs.readFileSync(path.resolve('src/animation/hero2dClips.js'), 'utf8');
const expectedClips = ['IDLE','WALK','RUN','TURN','STOP','JUMP','LANDING','INTERACT'];
for (const name of expectedClips) {
  if (!clipText.includes(name + ':')) throw new Error('Missing 2D clip ' + name);
}
if (!clipText.includes('export class Hero2DRenderer') && !fs.existsSync(path.resolve('src/animation/hero2d.js'))) {
  throw new Error('2D renderer module missing');
}
console.log('NEXUS animation architecture OK');
console.log('Primary parts:', primary.length);
console.log('Micro modules:', totalMicro);
console.log('2D clips:', expectedClips.length);
