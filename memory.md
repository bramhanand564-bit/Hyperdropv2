# NAX World — Project Memory

## Product Direction — LOCKED
NAX World is a **standalone single-player, fully 3D mobile game**.
The player opens the game and enters gameplay directly.

### Explicitly NOT part of this game
- NAX Chat
- NAX Store
- NAX Portal
- Social feed/community channels
- Guilds
- Multiplayer-first systems
- Creator marketplace

Those are separate ecosystem ideas and must not be mixed into the core game.

## Original-IP Rule — LOCKED
Use original story, characters, character designs, 3D models, animations, environments, puzzles, level layouts, UI, sound/music and code.

Broad genre/gameplay ideas may be used, but do not copy protected characters, dialogue, maps, logos, music, assets or source code from another game.

## Core Single-Player Concept
A mobile-first, third-person sci-fi mystery/puzzle adventure using time manipulation.

Core mechanics:
- Rewind
- Freeze
- Forward
- Puzzle rooms
- Moving hazards/traps
- Time fragments
- Future Time Echo mechanic
- Chapter progression
- Animated player/world
- Story snippets/cinematics
- Later stars, hints and achievements

## Chapter Plan
World 1 — Time Basics: Chapters 1–10
World 2 — Broken Time: Chapters 11–20
World 3 — Paradox: Chapters 21–30
World 4 — Collapse: Chapters 31–40
World 5 — Time Zero: Chapters 41–50

### Chapter 1 — The First Fracture
Current prototype objective:
1. Enter the 3D room
2. Explore
3. Use Rewind / Freeze / Forward
4. Reach the Time Fragment
5. Collect it
6. Reach the Time Gate
7. Complete the chapter

## Current Status
**IN PROGRESS — SOLO 3D CHAPTER PROTOTYPE**

Implemented:
- Fully 3D scene
- Third-person procedural player
- Touch joystick
- Swipe camera
- Jump
- Procedural walk animation
- Rewind movement history
- Freeze mode for hazards
- Forward mode for faster hazards/player movement
- Time Fragment objective
- Chapter 1 completion flow
- Mobile HUD
- No chat/store/portal systems

Not yet verified on a physical Android device.

## Development Rule
**BUILD SMALL -> TEST -> RECORD -> LOCK -> EXPAND**

Never mark WORKING or LOCKED without target-device test evidence.

## Mobile Requirements
Android-first, landscape gameplay, touch controls, practical large touch targets, 30 FPS baseline, 60 FPS on capable devices, low-memory/battery awareness, scalable graphics and asset streaming as chapters grow.

## Architecture
Phase 1: Chapter 1 vertical slice
Phase 2: player animation/save/progression
Phase 3: chapters and environments
Phase 4: advanced time mechanics + Time Echo
Phase 5: story/cinematics
Phase 6: optimization/accessibility/polish
Future systems must directly support the standalone game.

## Security
Never commit API keys, tokens, passwords, credentials or secrets.

## Change Log
- 2026-10-01: Legacy Hyperdropv2 application reset.
- 2026-10-01: First Three.js foundation created.
- 2026-10-01: Product direction clarified as standalone single-player 3D chapter game; social/store/portal removed from scope.
- 2026-10-01: Chapter 1 solo prototype and time-control mechanics added.
