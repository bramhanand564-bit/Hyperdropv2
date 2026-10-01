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
Current roadmap stage: V0.3 VERTICAL SLICE IN PROGRESS
Current total-game progress: 10%
Remaining: 90%

This percentage is based on milestone completion, not code size.
The project remains at 10% until the V0.3 milestone is completed and target-device testing is recorded.

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
1. Run syntax/static checks.
2. Open the GitHub Pages build.
3. Test the hub -> gate -> Lumen Wilds route on Android.
4. Test movement/camera/interactions and all three challenge types.
5. Test relay chain, secrets, checkpoint/respawn, radar, sound and graphics controls.
6. Fix regressions without rewriting stable systems.
7. Record Android test evidence and lock V0.3.
8. Begin V0.4 second-world expansion.

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
