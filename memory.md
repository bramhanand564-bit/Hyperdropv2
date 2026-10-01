# NAX World — Project Memory

## Source of Truth
This file is the persistent project memory for NAX World in `bramhanand564-bit/Hyperdropv2`.
Update it after major architecture decisions, verified fixes, milestones, tests, and breaking changes.

## Project Vision
Build an original, mobile-first, fully 3D virtual-world game with a persistent player identity, explorable worlds, social systems, gameplay, creator systems, AI features, and a future NAX ecosystem.

This is inspired by the broad idea of a connected virtual world, but it must use original IP, original names, original assets, original maps, original UI, and original implementation.

## Locked Decisions
- Repository: `bramhanand564-bit/Hyperdropv2`
- Target: Android-first, mobile-first
- Game: fully 3D; no 2.5D substitute
- Camera: third-person for the first playable slice
- Controls: touch-first
- Development workflow: GitHub/cloud/mobile-friendly
- Current constraint: no PC/computer available to the user
- Architecture: modular and expandable
- Performance: target 30 FPS baseline, 60 FPS on capable devices
- Build rule: BUILD SMALL -> TEST -> RECORD -> LOCK -> EXPAND

## Current State
Status: FOUNDATION RESET COMPLETE
Legacy Hyperdropv2 application files have been removed from the default branch.
The repository is intentionally starting clean for NAX World.

Engine decision: PENDING FINAL VALIDATION
Initial candidate direction: browser-based full 3D engine suitable for Android-first testing and later packaging.

## First Playable Vertical Slice
1. Start screen
2. Player identity
3. One small 3D environment
4. Fully 3D player avatar
5. Third-person camera
6. Touch movement / virtual joystick
7. Swipe camera
8. Jump
9. Basic interaction
10. Basic save/load
11. Mobile HUD
12. Mobile performance test

## Planned Modules
- Account / NAX ID
- Player / Avatar / Inventory / Progression / Achievements
- World / Zones / Buildings / NPCs / Interactive Objects
- Movement / Jump / Sprint / Climb / Swim
- Vehicles
- Social / Friends / Chat / Voice / Party / Guild
- Quests / Combat / Racing / Mini-games
- Economy / Currency / Inventory / Shops / Trading
- Creator Studio
- AI systems
- NAX Store
- Events
- Multiplayer
- Security / Moderation / Analytics

## Development Phases
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
11. Scale / Optimization / Security

## Testing Status Legend
- PLANNED
- IN PROGRESS
- TESTING
- WORKING
- LOCKED
- BLOCKED
- DEPRECATED

Never mark WORKING or LOCKED without actual test evidence.

## Mobile Requirements
- Landscape gameplay
- Responsive HUD and menus
- Virtual joystick
- Touch camera
- Jump / sprint / interact / action controls
- Low / medium / high graphics profiles
- Battery-aware behavior
- Low-memory handling
- Asset streaming
- Network reconnect handling
- Avoid unnecessary high-resolution assets

## Networking Principles
Important game state must be server-authoritative when multiplayer is introduced:
- Currency
- Inventory ownership
- Competitive scores
- Damage/results
- Rewards
- Match results
- Progression

Never trust the mobile client for authoritative economy or competitive results.

## Security
- Never commit API keys, tokens, passwords, private credentials, or secrets.
- Use environment variables / platform secrets.
- Record variable names and purpose only.
- Validate important server-side actions.

## Memory Rules
Record:
- Major architecture decisions
- Engine and tooling decisions
- Repo structure changes
- Modules and APIs
- Database/network decisions
- Security/performance decisions
- Completed features
- Verified bugs and fixes
- Build/deployment process
- Important commands
- Test results
- Milestones
- Breaking changes
- Locked components
- Rationale for major decisions

Do NOT record:
- Passwords, API keys, tokens, private credentials
- Sensitive personal information
- Temporary chat noise
- Unverified assumptions as facts
- Duplicate information
- Huge source-code copies
- Generated build output
- Temporary debug logs unless reproducible and useful

## Golden Rule
Do not build hundreds of untested systems at once.
BUILD SMALL -> TEST -> RECORD -> LOCK -> EXPAND.

## Change Log
- 2026-10-01: Legacy Hyperdropv2 application code and old CI workflow removed. Repository reset for NAX World.
