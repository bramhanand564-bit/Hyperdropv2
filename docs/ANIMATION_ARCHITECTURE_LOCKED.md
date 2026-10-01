# NEXUS Animation Architecture — LOCKED RULE

Every animated game object is decomposed into **100 primary parts**. Every primary part is decomposed into **100 micro-parts**.

**100 × 100 = 10,000 addressable animation/detail units per character.**

Each micro-module owns: design, geometry, material, attachment, idle, movement, interaction, state animation, mobile fallback, performance budget and QA/lock status.

**Workflow:** DESIGN → SPLIT 100 → SPLIT EACH 100 → IMPLEMENT → ANIMATE → TEST → PROFILE → LOCK → NEXT PART.

The hierarchy is represented by a registry plus a generator. We will not hand-maintain 10,000 runtime JS files; generated contracts provide the requested 100×100 decomposition without making Android/CI unmaintainable.

First target: **NEXUS Hero Character**.
