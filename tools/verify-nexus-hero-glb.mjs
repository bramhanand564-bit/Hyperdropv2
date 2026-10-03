#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const assetPath = path.resolve(process.cwd(), 'assets/characters/nexus-hero.glb');
const strict = process.argv.includes('--strict');

if (!fs.existsSync(assetPath)) {
  console.log('[NEXUS GLB] MISSING: assets/characters/nexus-hero.glb');
  console.log('[NEXUS GLB] The production binary must be generated/exported externally from the approved character reference.');
  if (strict) process.exit(2);
  process.exit(0);
}

const data = fs.readFileSync(assetPath);
if (data.length < 32) {
  console.error('[NEXUS GLB] INVALID: file is too small to be a valid GLB.');
  process.exit(2);
}

const magic = data.toString('ascii', 0, 4);
const version = data.readUInt32LE(4);
const declaredLength = data.readUInt32LE(8);

if (magic !== 'glTF') {
  console.error(`[NEXUS GLB] INVALID: expected glTF magic, got "${magic}".`);
  process.exit(2);
}
if (version !== 2) {
  console.error(`[NEXUS GLB] INVALID: expected GLB version 2, got ${version}.`);
  process.exit(2);
}
if (declaredLength !== data.length) {
  console.error(`[NEXUS GLB] INVALID: header length ${declaredLength} != file size ${data.length}.`);
  process.exit(2);
}

const jsonChunkLength = data.readUInt32LE(12);
const jsonChunkType = data.toString('ascii', 16, 20);
if (jsonChunkType !== 'JSON') {
  console.error(`[NEXUS GLB] INVALID: first chunk is "${jsonChunkType}", expected JSON.`);
  process.exit(2);
}

const jsonStart = 20;
const jsonEnd = jsonStart + jsonChunkLength;
if (jsonEnd > data.length) {
  console.error('[NEXUS GLB] INVALID: JSON chunk exceeds file bounds.');
  process.exit(2);
}

let gltf;
try {
  gltf = JSON.parse(data.toString('utf8', jsonStart, jsonEnd).replace(/\\u0000+$/g, '').trim());
} catch (error) {
  console.error('[NEXUS GLB] INVALID: embedded JSON could not be parsed.');
  console.error(error.message);
  process.exit(2);
}

const meshCount = Array.isArray(gltf.meshes) ? gltf.meshes.length : 0;
const nodeCount = Array.isArray(gltf.nodes) ? gltf.nodes.length : 0;
const materialCount = Array.isArray(gltf.materials) ? gltf.materials.length : 0;
const animationCount = Array.isArray(gltf.animations) ? gltf.animations.length : 0;

if (meshCount === 0 || nodeCount === 0) {
  console.error('[NEXUS GLB] INVALID: no mesh/node payload found.');
  process.exit(2);
}

console.log(`[NEXUS GLB] VALID: bytes=${data.length}, meshes=${meshCount}, nodes=${nodeCount}, materials=${materialCount}, animations=${animationCount}`);
