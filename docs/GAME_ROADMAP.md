# MASTER GAME ROADMAP — ORIGINAL VIRTUAL-WORLD 3D GAME

## Product rule
This project uses the *high-level design language* of large virtual-world adventure/tournament games as a reference point, but it is an original game.
No protected characters, names, dialogue, maps, scenes, logos, music, assets or source code are copied.

## Development rule
BUILD SMALL -> TEST -> RECORD -> LOCK -> EXPAND

A system is only marked VERIFIED/LOCKED after target-device testing evidence exists.

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

Current project target after this implementation: V0.2 = 10%.

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
- [ ] One polished playable zone
- [ ] Full first mission chain
- [ ] Three challenge types
- [ ] Better avatar customization
- [ ] NPC prototype
- [ ] Sound pass
- [ ] Map/radar pass
- [ ] Settings/graphics controls
- [ ] Checkpoint/respawn polish
- [ ] Mobile performance pass

## 04 — V0.4 WORLD EXPANSION — 20% -> 30%
- [ ] Second large zone
- [ ] Zone transitions
- [ ] World event manager
- [ ] Environmental secrets
- [ ] Multiple quest chains
- [ ] Better world streaming

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
- [ ] Low/medium/high graphics modes
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
