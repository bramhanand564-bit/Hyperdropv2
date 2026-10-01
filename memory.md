# NAX World — Project Memory

## Source of Truth
This file is the persistent project memory for NAX World in `bramhanand564-bit/Hyperdropv2`.
Update it after major architecture decisions, verified fixes, milestones, tests, and breaking changes.

## Project Vision
Build an original, mobile-first, fully 3D virtual-world game with persistent player identity, explorable worlds, social systems, gameplay, creator systems, AI features, and a future NAX ecosystem.

The project may be broadly inspired by the concept of a connected virtual world, but must use original IP, names, maps, assets, music, UI, and implementation.

## Locked Decisions
- Repository: `bramhanand564-bit/Hyperdropv2`
- Android-first / mobile-first
- Fully 3D; no 2.5D substitute
- Third-person camera for the first playable slice
- Touch-first controls
- GitHub/cloud/mobile-friendly workflow
- User currently has no PC/computer workflow requirement
- Modular architecture
- Performance target: 30 FPS baseline; 60 FPS on capable devices
- Build rule: BUILD SMALL -> TEST -> RECORD -> LOCK -> EXPAND

## Engine Decision
- Foundation engine: **Three.js r0.186.0**
- Delivery model for Phase 1: static browser build, suitable for Android browser testing
- Future packaging: evaluate native Android packaging after the web vertical slice is stable
- Source: official three.js release/site information; r186 is the current release at project start.

## Current Status
**IN PROGRESS — 3D FOUNDATION**
Implemented in this reset:
1. Three.js 3D scene
2. Third-person camera
3. Procedural fully 3D player avatar
4. Touch joystick
5. Swipe camera
6. Jump
7. Sprint
8. Small explorable 3D zone
9. Discovery/interact points
10. Local save/load
11. Mobile HUD + mini-map
12. GitHub Pages deployment workflow

Not yet verified on a physical Android device.

## First Playable Vertical Slice
- [x] Start screen
- [x] Player identity input
- [x] One 3D environment
- [x] One 3D avatar
- [x] Third-person camera
- [x] Touch movement
- [x] Camera swipe
- [x] Jump
- [x] Basic interaction
- [x] Basic local save/load
- [x] Mobile HUD
- [ ] Physical mobile performance test
- [ ] Lock foundation after test

## Planned Modules
Account / NAX ID / Avatar / Inventory / Progression / Achievements / World / Zones / Buildings / NPCs / Interactive Objects / Movement / Vehicles / Social / Chat / Voice / Party / Guild / Quests / Combat / Racing / Mini-games / Economy / Creator Studio / AI / NAX Store / Events / Multiplayer / Security / Analytics.

## Phase Roadmap
1. Foundation
2. Player
3. World
4. Multiplayer
5. Social
6. Gameplay
7. Economy
8. Creator Studio
9. AI
10. NAX Store
11. Scale / optimization / security

## Testing Status
PLANNED / IN PROGRESS / TESTING / WORKING / LOCKED / BLOCKED / DEPRECATED

Never mark WORKING or LOCKED without actual test evidence.

## Mobile Requirements
Landscape gameplay, responsive HUD, virtual joystick, touch camera, jump/sprint/interact/action controls, low/medium/high profiles, battery-aware behavior, low-memory handling, asset streaming, network reconnect handling.

## Networking Principles
When multiplayer is added, server-authoritative state will cover currency, inventory ownership, competitive scores, damage/results, rewards, match results, and progression.

## Security
Never commit API keys, tokens, passwords, credentials, or secrets. Use environment variables / platform secrets. Record variable names and purpose only.

## Memory Rules
Record major architecture decisions, tooling decisions, repo changes, systems, APIs, database/network decisions, security/performance decisions, completed features, verified bugs/fixes, build/deployment, tests, milestones, breaking changes, locked components, and rationale.

Do not record secrets, sensitive personal data, temporary chat noise, unverified assumptions as facts, duplicate information, huge source copies, generated build output, or temporary logs without reproducible value.

## Golden Rule
**BUILD SMALL -> TEST -> RECORD -> LOCK -> EXPAND**

## Change Log
- 2026-10-01: Legacy Hyperdropv2 application files and old CI workflow removed.
- 2026-10-01: NAX World Three.js r0.186.0 foundation and mobile vertical slice committed.
