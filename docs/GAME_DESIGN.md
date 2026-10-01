# GAME DESIGN BIBLE — VIRTUAL-WORLD EXPERIENCE

## Design target
Create a large-scale virtual-world experience with exploration, distinct worlds, skill challenges, discovery, progression, events and strong audiovisual identity.

The reference is a design benchmark only. The game's story, characters, world rules, visuals, interface language and mechanics are original.

## Core player fantasy
"Enter a huge digital universe, become a unique avatar, discover places and challenges, master different skills, unlock deeper areas, and become one of the world's top challengers."

## Pillars
1. Explore
2. Discover
3. Challenge
4. Progress
5. Master
6. Return

## Game loop
ENTER WORLD
-> EXPLORE
-> NOTICE SIGNAL / EVENT
-> INTERACT
-> ACCEPT CHALLENGE
-> COMPLETE OBJECTIVE
-> EARN XP / CREDITS / ACCESS
-> UNLOCK SOMETHING
-> DISCOVER NEXT AREA

## World design
The world is modular:
GAME
- WORLD
  - ZONE
    - LANDMARK
    - BUILDING
    - ACTIVITY
    - SECRET

Every world should have a distinct gameplay identity, not only a different texture set.

## Challenge language
Challenges may include:
- Racing
- Timing
- Platforming
- Puzzle
- Exploration
- Chase
- Combat
- Vehicle skill
- Logic
- Discovery

The game should not depend on killing as its universal solution.

## Avatar language
Characters are original and recognizable:
- Distinct silhouette
- Clear color/material grouping
- Modular clothing
- Different accessories
- Expressive animation
- Readable at mobile viewing distance

## UI language
The HUD should feel like an in-world digital system without copying another game's UI.
Use:
- Minimal top status
- Objective card
- Clear interaction prompt
- Event alerts
- Reward toast
- Compact mobile controls

## Alert priorities
P0 = critical gameplay event
P1 = mission/objective
P2 = reward/discovery
P3 = informational

Alerts must not spam the player.

## Progression
Early:
- XP
- Credits
- World access
- Challenge records

Later:
- Cosmetics
- Vehicles
- Abilities
- Collections
- Special access
- Achievements

## Mobile rules
- Landscape-first gameplay
- Large touch targets
- Touch-safe UI margins
- 30 FPS baseline
- 60 FPS target on capable devices
- Avoid memory-heavy assets in the first vertical slice

## V0.3 first playable zone — Lumen Wilds
Lumen Wilds is the first distinct zone beyond the Central Hub. It uses a darker luminous-grove identity, relay nodes, a Shrine landmark, optional discovery shards, a checkpoint and hazard recovery.

Playable chain:
Central Hub -> Signal Run -> Central Gate -> Scout -> 3 Relay Nodes -> Lumen Shrine -> Return Gate.

Optional systems in the zone:
- 3 Lumen shard secrets
- Checkpoint synchronization
- Hazard respawn
- Radar panel
- Replayable hub challenges

## Current vertical slice
V0.2 prototype contains:
- Central 3D hub
- Third-person avatar
- Touch movement
- Camera swipe
- Jump/sprint
- Interactable mission terminal
- Three signal beacons
- A timed "Signal Run" challenge
- XP + credits
- System alerts
- Local save
- Basic chapter/mission progression

## Story layer
The story is intentionally not locked yet.
The game systems are being built so that the user's original story can later sit on top of the same world/challenge architecture.

## Current exclusions
- No NAX Chat
- No NAX Store
- No NAX Portal
- No social feed
- No multiplayer-first dependency
