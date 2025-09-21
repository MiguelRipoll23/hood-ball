# Core Module Decomposition Audit

Phase 7 tracking note – updated 2025-02-14

The tables below capture each remaining src/core artifact, its dominant dependencies, and the recommended destination once the engine/game split is finished. Use this as the source of truth when scheduling follow-up moves.

## Entities (src/core/entities)
| Module | Key Dependencies | Suggested Destination | Follow-up Notes |
| --- | --- | --- | --- |
| base-animated-entity.ts | AnimationType enum (engine), EntityAnimationService | Engine | AnimationType and animation service now live in the engine; move once base moveable/multiplayer hierarchy is decoupled from game state. |
| base-dynamic-colliding-game-entity.ts | Base collision classes, debug gizmos | Engine | Can migrate with the rest of the collision stack once base classes relocate. |
| base-moveable-game-entity.ts | Inherits BaseMultiplayerGameEntity (game networking) | Game | Create an engine-owned BaseTransformableEntity before extracting movement helpers. |
| base-multiplayer-entity.ts | EntityType, GamePlayer, serialization hooks (game) | Game | Remains game-specific until multiplayer ownership rules are abstracted. |
| base-static-colliding-game-entity.ts | HitboxEntity, collision exclusions | Engine | Blocked by the moveable/multiplayer refactor noted above. |
| base-tappable-game-entity.ts | Engine pointer model, debug overlays | Engine | Requires the animation base to land in the engine stack first. |
| debug-entity.ts | Engine timer service, canvas UI behaviour | Game | Debug overlay is game UX; keep with game UI entities after base move. |
| hitbox-entity.ts | BaseGameEntity, debug visuals | Engine | Update imports to point at @engine/entities/base-game-entity when moving. |
| loading-indicator-entity.ts | Game color palette, canvas presentation | Game | Belongs with game UI (depends on game constants). |
| notification-entity.ts | Game UI behaviour, animation helpers | Game | Move alongside HUD/overlay entities. |

## Models (src/core/models)
| Module | Key Dependencies | Suggested Destination | Follow-up Notes |
| --- | --- | --- | --- |
| base-event.ts | EventType enum (game) | Game | Convert to engine contract once events use engine tokens instead of game enums. |
| game-state.ts | GamePlayer, Match, GameServer, session state | Game | Already mirrored by src/game/state; relocate and delete the core copy. |
| local-event.ts | EventType, BaseEvent | Game | Move with BaseEvent; ensure engine event queue consumes contract only. |
| remote-event.ts | EventType, BaseEvent | Game | Same as above; becomes part of game networking layer. |

## Interfaces (src/core/interfaces)
| Module | Key Dependencies | Suggested Destination | Follow-up Notes |
| --- | --- | --- | --- |
| entities/animatable-entity.ts | Engine animation consumers | Engine ✔ | Relocated under src/engine/interfaces/entities/ (2025-02-14). |
| input/game-gamepad-interface.ts | Engine input model | Engine | Co-locate with existing engine input models. |
| input/game-gamepad.ts | Engine input model | Engine | Replace with the engine interface export once moved. |
| input/game-keyboard-interface.ts | Engine input model | Engine | Same as above. |
| input/game-keyboard.ts | Engine input model | Engine | Same as above. |
| input/game-pointer-interface.ts | Engine pointer abstraction | Engine | Move to src/engine/contracts/input/. |
| input/game-pointer-touch-point.ts | Pointer DTO | Engine | Move with pointer contract. |
| input/game-pointer.ts | Pointer contract | Engine | Move with pointer suite. |
| models/game-event.ts | EventType enum (game) | Game | Align with game event models until engine contract exists. |
| scenes/game-scene.ts | LayerType, GameEntity | Engine | Shift to engine contracts after LayerType moves into game or shared config. |
| scenes/multiplayer-scene.ts | SceneType, EntityType, multiplayer entity interfaces | Game | Multiplayer concerns remain game-owned. |
| scenes/scene-manager.ts | Scene lifecycle contract | Engine | Move with scene manager service when extracted. |

## Utilities (src/core/utils)
| Module | Key Dependencies | Suggested Destination | Follow-up Notes |
| --- | --- | --- | --- |
| base64-utils.ts | None | Engine | General-purpose helper; move to src/engine/utils. |
| binary-reader-utils.ts | None | Engine | Likewise. |
| binary-writer-utils.ts | None | Engine | Likewise. |
| debug-utils.ts | Canvas-only helpers | Engine | Supports engine debug overlays. |
| entity-utils.ts | Game WebRTC peer, canvas constants | Game | Stays with gameplay networking utilities. |
| math-utils.ts | Math helpers | Engine | Move to src/engine/utils. |
| scene-utils.ts | SceneType, BaseMultiplayerScene | Game | Depends on multiplayer scene types; move with scene orchestration. |

## Next Steps
Update the roadmap checklist once the above mapping is committed.
When relocating a module, rewrite imports to use the new @engine/* and @game/* aliases and delete the old core copy in the same change.
Schedule the multiplayer/base-entity extraction so the collision hierarchy can finally leave src/core.
