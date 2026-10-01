# NEXUS — ORIGINAL VIRTUAL-WORLD 3D GAME

A standalone, mobile-first, fully 3D virtual-world game prototype.

This project uses the high-level design language of large virtual-world adventure/tournament games as a reference while keeping the game's characters, story, worlds, mechanics, UI, art and code original.

## Current stage

V0.4 — WORLD EXPANSION IN PROGRESS

Total game development completion: 20%

80% remains on the master roadmap.

## Current build

### Central Hub
- Third-person 3D avatar
- Touch joystick
- Swipe camera
- Jump
- Sprint
- Original procedural avatar
- Three persistent avatar styles
- Permanent NEXUS Home opening spawn with framed camera and idle avatar presentation
- Mission terminal
- Three challenge pads
- Signal beacons
- XP / credits
- Local save

### Lumen Wilds
- Functional zone transition
- Distinct environment
- Scout + Keeper NPCs
- Relay restoration mission
- Shrine objective
- Return-gate completion
- Three optional secret shards
- Checkpoint synchronization
- Hazard respawn
- Radar panel

### Aether Basin — V0.4 second world
- Original teal/indigo Basin environment
- Lumen Wilds -> Basin Gate transition
- Archivist + Runner NPCs
- Four-anchor resonance mission
- Resonance Vault objective
- Two optional Basin discovery shards
- Basin checkpoint + hazard recovery
- Resonance Surge timed world event
- Replayable Resonance Sprint with best-time tracking
- Basin radar + navigation integration

### System polish
- Signal Run, Memory Grid and Core Delivery challenge types
- Sound feedback toggle
- High / Medium / Low graphics toggle
- Mobile-first HUD and touch controls

## Development rule

BUILD SMALL -> TEST -> RECORD -> LOCK -> EXPAND

## Roadmap

See docs/GAME_ROADMAP.md

## Design Bible

See docs/GAME_DESIGN.md

## Project memory

See memory.md

## Scope exclusions

The standalone core game does not depend on NAX Chat, NAX Store, NAX Portal, social feeds, guilds or multiplayer.

## Run

This is a browser-based Three.js prototype. Use a static server or GitHub Pages. Three.js is loaded from the pinned CDN import map in index.html.

## Verification status

V0.4 World Expansion is in progress at 20% development progress. The opening Home spawn is implemented, but physical Android verification and the V0.4 QA/LOCK sign-off remain pending.



## V0.4 verification

Aether Basin implementation is present, but V0.4 browser/device QA and target-device verification are still pending.