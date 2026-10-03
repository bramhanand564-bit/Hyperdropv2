# NEXUS Animation Architecture — LOCKED RULE

Every animated game object is decomposed into **100 primary parts**. Every primary part is decomposed into **100 micro-parts**.

**100 × 100 = 10,000 addressable animation/detail units per character.**

Each micro-module owns: design, geometry, material, attachment, idle, movement, interaction, state animation, mobile fallback, performance budget and QA/lock status.

**Workflow:** DESIGN → SPLIT 100 → SPLIT EACH 100 → IMPLEMENT → ANIMATE → TEST → PROFILE → LOCK → NEXT PART.

The hierarchy is physically materialized as 10,000 addressable 3D micro-module JSON files and rendered through one mobile-safe InstancedMesh layer. The files carry the 3D contract while runtime geometry is generated from the primary/micro address, avoiding 10,000 network/file fetches.

First target: **NEXUS Hero Character**.


## 3D runtime
The NEXUS Hero now mounts a 10,000-instance procedural 3D micro-detail layer. The existing 2D canvas preview remains a separate QA/reference renderer; it does not replace the 3D character.


## Ultra-HD detail rule — LOCKED
The 10,000 micro-module files are addressable 3D contracts, not filler source-code files. A requirement of thousands of duplicated source-code lines per file is explicitly avoided because line count does not produce visual fidelity and would create an impractical 30–100 million-line repository.

Ultra-HD quality is measured by implemented 3D geometry/material/lighting/animation data, deterministic per-instance transforms, LOD behavior, and target-device performance. HIGH quality uses a denser 3D micro primitive across the 10,000-instance layer; MEDIUM and LOW reduce the active instance budget for mobile safety.

The target is original high-fidelity 3D presentation in the same broad quality category as modern mobile 3D games, without copying protected characters, assets, maps, or visual expression from PUBG or Free Fire.
