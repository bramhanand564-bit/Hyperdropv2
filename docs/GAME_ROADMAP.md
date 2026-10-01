# MASTER GAME ROADMAP — ORIGINAL VIRTUAL-WORLD 3D GAME

## Product rule
This project uses the *high-level design language* of large virtual-world adventure/tournament games as a reference point, but it is an original game.
No protected characters, names, dialogue, maps, scenes, logos, music, assets or source code are copied.

## Development rule
BUILD SMALL -> TEST -> RECORD -> LOCK -> EXPAND

A system is only marked VERIFIED/LOCKED after target-device testing evidence exists. Development percentage and verification status are tracked separately so untested hardware claims are never treated as completed verification.

## Completion metric
The total-game percentage is a project-management milestone metric, not a percentage of source-code lines.

- V0.1 Foundation = 5%
- V0.2 Playable Core = 10%
- V0.3 Vertical Slice = 20%
- V0.4 World Expansion = 30%
- V0.5 Vehicle Layer = 40%
- V0.6 Challenge/Combat Expansion = 50%
- V0.7 Multi-World = 60%
- V0.8 Advanced World Systems = 70%
- V0.9 Polish + Optimization = 85%
- V1.0 Complete Core Game = 100%

Current project target: **V0.4 WORLD EXPANSION IN PROGRESS**
Current total-game development percentage: **20%**
Remaining: **80%**

V0.3 implementation is complete and the project is now tracked at 20% for development progress. Physical Android verification remains a separate release-readiness gate and is not claimed as completed.

## 01 — V0.1 FOUNDATION — 0% -> 5%
- [x] Three.js runtime foundation
- [x] Mobile-first canvas
- [x] GitHub Pages deployment workflow
- [x] ES module architecture
- [x] Project memory / source-of-truth document
- [ ] Production asset pipeline
- [ ] Advanced scene/asset streaming

## 02 — V0.2 PLAYABLE CORE — 5% -> 10%
- [x] Third-person player
- [x] Touch joystick
- [x] Swipe camera
- [x] Jump
- [x] Sprint
- [x] Stylized original avatar prototype
- [x] First 3D hub prototype
- [x] World interaction framework
- [x] Mission framework prototype
- [x] Alert/notification framework prototype
- [x] Challenge framework prototype
- [x] XP/credits/save prototype
- [ ] Physical Android verification
- [ ] Formal LOCKED sign-off

## 03 — V0.3 VERTICAL SLICE — 10% -> 20%
- [x] One substantial playable zone: Lumen Wilds
- [x] Full first mission chain: hub mastery -> zone entry -> Scout -> relays -> Shrine -> return gate
- [x] Three challenge types: Signal Run, Memory Grid, Core Delivery
- [x] Better avatar customization: three persistent style variants
- [x] NPC prototype and contextual dialogue
- [x] Sound pass: lightweight WebAudio feedback cues
- [x] Map/radar pass: functional zone radar panel
- [x] Settings/graphics controls: High/Medium/Low + sound toggle
- [x] Checkpoint/respawn pass with Lumen Wilds hazard recovery
- [ ] Mobile performance pass on physical Android hardware
- [ ] Formal V0.3 target-device verification
- [ ] Formal V0.3 LOCKED sign-off

V0.3 implementation milestone: **COMPLETE (20% development progress)**. Device verification is still pending.

### V0.3 functional slice now present
Central Hub -> Central Gate -> Lumen Wilds -> Scout -> three relays -> Lumen Shrine -> return gate.

Optional discovery:
- 3 Lumen shards
- checkpoint synchronization
- hazard respawn
- replayable challenge pads
- local progression/save

## 04 — V0.4 WORLD EXPANSION — 20% -> 30% — IN PROGRESS
- [x] Second large zone: Aether Basin
- [x] Zone transition beyond the first slice (Lumen Wilds -> Aether Basin -> Lumen Wilds)
- [x] Lightweight world event cycle: Resonance Surge
- [x] Environmental secrets expansion: two Basin discovery shards
- [x] Multiple quest chains across Lumen Wilds and Aether Basin
- [x] Replayable Basin side activity with best-time tracking
- [x] Better world streaming foundation: distance-based decorative culling
- [ ] Production-grade asset/zone streaming

## 05 — V0.5 VEHICLE LAYER — 30% -> 40%
- [ ] Vehicle controller
- [ ] Vehicle camera
- [ ] Enter/exit
- [ ] First race activity
- [ ] Vehicle interaction
- [ ] Vehicle upgrade/cosmetic foundations

## 06 — V0.6 CHALLENGE + COMBAT EXPANSION — 40% -> 50%
- [ ] Combat controller
- [ ] Enemy AI foundation
- [ ] Arena challenge
- [ ] Puzzle framework expansion
- [ ] Chase/escape challenge
- [ ] Advanced rewards

## 07 — V0.7 MULTI-WORLD — 50% -> 60%
- [ ] Third world
- [ ] Fourth world
- [ ] World registry
- [ ] World unlock progression
- [ ] Cross-world collectibles
- [ ] Multi-world mission chain

## 08 — V0.8 ADVANCED WORLD SYSTEMS — 60% -> 70%
- [ ] Dynamic events
- [ ] Advanced NPC behaviors
- [ ] Boss/major challenge systems
- [ ] Advanced vehicles
- [ ] Hidden worlds/secret routes
- [ ] Expanded progression

## 09 — V0.9 POLISH + OPTIMIZATION — 70% -> 85%
- [ ] LOD / draw-call optimization
- [ ] Texture and memory budget
- [ ] Battery-aware graphics
- [x] Low/medium/high graphics modes
- [ ] Audio polish
- [ ] Accessibility pass
- [ ] Save robustness
- [ ] Crash/edge-case cleanup
- [ ] Android device matrix testing

## 10 — V1.0 COMPLETE CORE GAME — 85% -> 100%
- [ ] Complete original story layer
- [ ] Complete core world set
- [ ] Complete major challenge set
- [ ] Full progression loop
- [ ] Final end-to-end QA
- [ ] Release build
- [ ] Store-ready packaging later

## Future / optional after the standalone core is stable
- Online services
- Cloud save
- Leaderboards
- Ghost competition
- Online tournaments
- Multiplayer

These are not allowed to destabilize the standalone single-player core.

## Change-control rule
Before changing a LOCKED system:
1. Record the reason.
2. Record the regression risk.
3. Make the smallest safe change.
4. Retest the affected system.
5. Update this roadmap and memory.


### V0.4 work log — Aether Basin foundation
- Second substantial 3D zone added with a distinct visual identity.
- Basin mission chain: Archivist -> four resonance anchors -> Resonance Vault -> return lift.
- Two optional Basin discovery shards and a zone-specific checkpoint were added.
- Lumen Wilds now has a Basin Gate that unlocks after the Shrine objective.
- Basin has hazard recovery, collision geometry, radar entries, navigation targets, save/load state and a timed Resonance Surge world event.
- V0.4 remains at 20% total-project progress until the milestone is completed and verified; no percentage inflation is used for partial implementation.
- Opening experience foundation: permanent NEXUS Home spawn pad at the Central Hub, framed opening camera, and a lightweight player idle pose so a new session begins with the avatar visibly standing in a defined home location.
