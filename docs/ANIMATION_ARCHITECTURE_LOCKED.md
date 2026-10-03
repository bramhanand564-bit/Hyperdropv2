# NEXUS Animation Architecture — LOCKED RULE

Every animated game object is decomposed into **100 primary parts**. Every primary part is decomposed into **100 micro-parts**.

**100 × 100 = 10,000 addressable animation/detail units per character.**

Each micro-module owns: design, geometry, material, attachment, idle, movement, interaction, state animation, mobile fallback, performance budget and QA/lock status.

**Workflow:** DESIGN → SPLIT 100 → SPLIT EACH 100 → IMPLEMENT → ANIMATE → TEST → PROFILE → LOCK → NEXT PART.

The hierarchy is physically materialized as 10,000 addressable 3D micro-module JSON files and rendered through one mobile-safe InstancedMesh layer. The files carry the 3D contract while runtime geometry is generated from the primary/micro address, avoiding 10,000 network/file fetches.

First target: **NEXUS Hero Character**.


## 3D runtime
The NEXUS Hero now mounts a 10,000-instance procedural 3D micro-detail layer. The existing 2D canvas preview remains a separate QA/reference renderer; it does not replace the 3D character.
