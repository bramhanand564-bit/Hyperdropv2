# PROJECT MEMORY — ORIGINAL VIRTUAL-WORLD 3D GAME

## Product Direction — LOCKED
Standalone, mobile-first, fully 3D virtual-world adventure/game.
The reference is the *design/experience category* of large virtual-world tournament games; it is not a story or asset copy.

## Explicit exclusions — LOCKED
- NAX Chat
- NAX Store
- NAX Portal
- Social feed/community systems
- Guilds
- Multiplayer-first architecture
- Creator marketplace

## Original-IP rule — LOCKED
Original characters, character designs, 3D models, animations, environments, challenges, levels, UI, audio, story and code.
High-level genre/gameplay ideas may overlap with the category; protected expression must not be copied.

## Master source of truth
See:
- docs/GAME_ROADMAP.md
- docs/GAME_DESIGN.md

## Completion metric
Current roadmap stage: V0.4 WORLD EXPANSION IN PROGRESS
Current total-game development progress: 20%
Remaining: 80%

This percentage tracks development milestone completion, not code size. V0.3 implementation is complete. Physical Android verification remains a separate release-readiness gate and is not claimed as complete.

## Current playable scope
- Central 3D Hub
- Lumen Wilds first substantial playable zone
- Third-person player
- Touch joystick
- Swipe camera
- Jump
- Sprint
- Original stylized avatar
- Three persistent avatar styles
- World interaction
- Full first zone mission chain
- Scout + Keeper NPC prototypes
- Three challenge prototypes: Signal Run, Memory Grid, Core Delivery
- Three optional Lumen shard secrets
- Checkpoint synchronization
- Hazard respawn
- Functional radar panel
- Lightweight WebAudio feedback
- High / Medium / Low graphics control
- XP and credits
- Local save
- Mobile HUD

## V0.3 chain
1. Find signal terminal.
2. Complete Signal Run.
3. Enter Lumen Wilds through the Central Gate.
4. Meet the Scout.
5. Activate three relay nodes.
6. Awaken the Lumen Shrine.
7. Use the return gate to close the zone chain.

## Not yet verified
Physical Android target-device testing and formal V0.3 LOCKED sign-off have not been completed.

## Next locked development order
1. Complete V0.3 Android/device verification when a target device is available.
2. Record any device regressions and patch only affected systems.
3. Formalize V0.3 LOCKED status after evidence exists.
4. Begin V0.4 second-world expansion.
5. Build the second zone with reusable world-event and streaming foundations.

## Change rule
BUILD SMALL -> TEST -> RECORD -> LOCK -> EXPAND.
Never claim VERIFIED or LOCKED without target-device evidence.

## Changelog
- 2026-10-01: Hyperdropv2 legacy application reset.
- 2026-10-01: Three.js mobile 3D foundation created.
- 2026-10-01: Standalone virtual-world direction selected.
- 2026-10-01: TIME LOCK prototype superseded by original virtual-world game architecture.
- 2026-10-01: V0.2 playable core rebuilt with hub, avatar, interaction, challenge, alerts, progression and save prototype.
- 2026-10-01: NPC prototype and three challenge types added; V0.3 vertical slice started.
- 2026-10-01: Added three original avatar style variants and persistent avatar selection.
- 2026-10-01: Built Lumen Wilds, first zone transition, full zone mission chain, relay system, three secrets, checkpoint/respawn, radar panel, audio cues and graphics/sound controls.
- 2026-10-01: Added standalone NEXUS CI syntax workflow and V0.3 mobile test plan.
- 2026-10-01: Added local-progress reset control to make repeat Android testing safer and faster.
- 2026-10-01: Hardened V0.3 state handling with action cooldowns, legacy-save migration and impossible-state normalization.
- 2026-10-01: Added quality presets for camera/fog/pixel ratio plus lightweight FPS/draw-call telemetry for mobile performance testing.
- 2026-10-01: Fixed local reset so both current and legacy saves are cleared.
- 2026-10-01: Added persistent challenge-clear and best-time records for Signal Run, Memory Grid and Core Delivery.

- 2026-10-01: Added mobile lifecycle recovery so hidden/blurred pages release joystick, sprint and camera transient input safely.
- 2026-10-01: V0.3 implementation milestone advanced to 20% development progress; Android verification remains explicitly pending.
- 2026-10-01: Started V0.4 world expansion with the original Aether Basin second zone, four-anchor mission chain, two secrets, checkpoint/respawn, Basin Gate transition, radar/navigation integration, save/load integration and Resonance Surge world events.
- 2026-10-01: Added the replayable Aether Basin Resonance Sprint with four route gates, a 30-second timer, rewards and persistent clear/best-time record.
- 2026-10-01: Optimized timed event HUD updates and added pagehide/blur progress save handling for better mobile lifecycle reliability.
- 2026-10-01: Added visible Resonance Surge propagation across eight Aether Basin event nodes and zone-specific fog-density tuning.
- 2026-10-01: Added a V0.4 distance-based decorative streaming foundation for Aether Basin to reduce active scene load while keeping required gameplay objects unaffected.
- 2026-10-01: Removed the blocking NEXUS start card and booted directly into the 3D Home lobby.
- 2026-10-01: Diagnosed Android black-screen behavior as a runtime/module-loading risk after the start card was removed; Android APK packaging now rewrites the Three.js import to a local relative module and the resulting APK build passes.
- 2026-10-01: Physical Android gameplay verification remains pending; build/CI success is not treated as device verification.
- 2026-10-01: Android APK v33 hardened again after the uploaded 4.76-second black-screen video: the APK now bundles Three.js + game code into a single classic `game.bundle.js` using esbuild, eliminating WebView `file://` ES-module/import-map resolution as a startup dependency. Build v33 passed and the APK asset was inspected to confirm the bundle is present.

- 2026-10-01: A-to-Z startup scan found an accidental `.mesh()` call replacement in `buildPlayer()` (body.mesh, group.mesh, scene.mesh) introduced during the hero-avatar detail pass. Replaced all four with Three.js `.add()`; static scan now reports zero `.mesh()` calls in `src/main.js`/\`src/lobby.js\`. Extended CI/package syntax checks to both game scripts.
- 2026-10-01: Android Build #50 was triggered from the startup-crash fix commit; physical Android verification remains pending until the APK is installed on the target device.

- 2026-10-01: LOCKED animation architecture rule: every animated object is decomposed into 100 primary modules, and every primary module into 100 micro-modules (10,000 addressable units per character). Added docs/ANIMATION_ARCHITECTURE_LOCKED.md, animation/characters/nexus-hero/character-100x100.json, and tools/generate-100x100-animation-tree.mjs. Runtime remains modular without committing 10,000 hand-written JS files.

- 2026-10-01: The locked 100×100 rule is now physically materialized in the repository for NEXUS Hero: 100 primary directories × 100 micro-module files = 10,000 addressable animation/detail files under animation/characters/nexus-hero/. Commit 08f454bdb29ca6725fc6c42456322d24a3931720.

- 2026-10-03: Converted the locked 100×100 micro-module set from Markdown placeholders to 10,000 machine-readable 3D JSON specs and added a 10,000-instance procedural 3D micro-detail runtime layer for NEXUS Hero. Physical Android verification remains pending.

- 2026-10-03: Fixed the NEXUS Home startup crash shown by Android ("Cannot read properties of undefined (reading 'color')"). The avatar style path was treating animated rig Groups as direct Mesh materials; applyAvatarStyle now safely traverses each part and colors only mesh materials. Physical Android verification remains pending.
