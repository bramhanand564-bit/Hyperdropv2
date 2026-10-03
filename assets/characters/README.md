# NEXUS Hero Production GLB

Expected production asset:

`assets/characters/nexus-hero.glb`

## Contract
- Full-body single NEXUS Hero character.
- Reference-driven black/white/electric-blue design.
- PBR materials and emissive blue details.
- Front/side/back geometry must represent one consistent character.
- Rig/animation clips may be embedded in the GLB.
- Target runtime height is normalized automatically to 2.85 world units.
- Three.js loads the asset through `src/animation/nexusHeroGLB.js`.
- If the GLB is absent, the game keeps the procedural fallback and remains playable.

The repository does not fabricate a binary GLB from text. The actual GLB must be generated/exported by a 3D modeling or image-to-3D pipeline and then added at this exact path.
