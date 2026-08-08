# Hood Ball — Architecture Review

*Last updated: August 2026*

## Summary

Hood Ball is a multiplayer HTML5 canvas game with a custom engine. Clean engine/game separation, DI via `@needle-di/core`, host-authoritative WebRTC networking. This review reflects the state after the ECS-lite component system, inheritance flattening, DI standardization, logger migration, and performance optimizations.

---

## Category Grades

| Category | Grade | Notes |
|----------|-------|-------|
| Architecture | **A** | Clean engine/game separation. WorldScene decomposed into WeatherSystem + ChatUISystem. |
| Entity System | **A** | Inheritance flattened 7→4 levels. ECS-lite (7 components). Physics deprecated fields removed. Override consistency enforced. |
| Networking | **A** | Host-authoritative star topology, 3-channel WebRTC, binary protocol, ECDSA signatures. |
| Event System | **A-** | Local/remote queue separation. Host authority enforced. Batching would help. |
| DI / Service Layer | **A** | Constructor deps objects only. No `container.get()` in constructors. Fully mockable. |
| Performance | **A-** | Spatial grid for collision (O(n) typical). Ball gradient eliminated (no allocations). Smoke particles use proper delta scaling. |
| Security | **A-** | ECDSA-signed chat, anti-cheat rules, host-only remote event dispatch. |
| Code Quality | **A** | 0 eslint-disable comments. 0 raw `console.*` calls. Consistent `override` usage. `.prettierrc` + `.editorconfig`. |
| Tooling | **A-** | Prettier + EditorConfig added. ESLint flat config. `noImplicitOverride` not yet enabled. |
| Test Coverage | **F** | No tests. DI is mockable — add Vitest tests for serialization, collision math, events. |

---

## Entity Hierarchy

```
BaseGameEntity                              (lifecycle, state, opacity, component container)
└─ BaseMultiplayerGameEntity                (+NetworkComponent)
   └─ BaseMoveableGameEntity               (+TransformComponent, scale, animations)
      ├─ BaseTappableGameEntity            (+InteractionComponent) → 14 UI entities
      ├─ BaseCollidingGameEntity           (+PhysicsComponent + CollisionComponent)
      │   ├─ CarEntity, BallEntity          (isDynamic = true)
      │   └─ GoalEntity, BoostPadEntity     (isDynamic = false)
      └─ 12 non-colliding entities          (snow, confetti, explosions, UI)

Max depth: 4 (was 7). Components: Transform, Physics, Collision, Network, Interaction.
Access: entity.getComponent(TransformComponent)?.teleport(x, y)
```

## Component Catalog

| Component | Key Properties | Used By |
|-----------|---------------|---------|
| `TransformComponent` | x, y, width, height, angle, scale, teleport() | BaseMoveableGameEntity |
| `PhysicsComponent` | vx, vy, mass, bounciness, rigidBody, isDynamic, resetVelocity() | BaseCollidingGameEntity |
| `CollisionComponent` | hitboxEntities, collidingEntities, collision exclusions | BaseCollidingGameEntity |
| `NetworkComponent` | networkId, typeId, owner, syncable, sync flags | BaseMultiplayerGameEntity |
| `InteractionComponent` | active, hovering, pressed, stealFocus | BaseTappableGameEntity |

## WorldScene Decomposition

| Subsystem | Location | Responsibility |
|-----------|----------|---------------|
| `WeatherSystem` | `systems/weather-system.ts` | Snow effects, icy friction |
| `ChatUISystem` | `systems/chat-ui-system.ts` | Chat input, match menu, player list |
| `WorldController` | `world-controller.ts` | Countdown, spawn points, demolitions |
| `ScoreManagerService` | `services/gameplay/score-manager-service.ts` | Goals, scoring, game-over |
| `WorldEntityFactory` | `world-entity-factory.ts` | Entity creation (cars, ball, goals, etc.) |

## Networking Model

- **Star topology**: One host, peers connect to host via WebRTC
- **3 data channels**: reliable-ordered (handshake, events), reliable-unordered (chat, removal), unreliable-unordered (entity state, ping)
- **Host authority**: Only the host dispatches remote events. Non-host injection silently dropped.

## Event System

- **Local queue**: Process-local signals (connection lifecycle, UI triggers). Every client subscribes independently.
- **Remote queue**: Host-dispatched authoritative changes. Non-hosts mirror them.

## Dependency Injection

- **Pattern**: Constructor deps objects (e.g., `WorldSceneDependencies`). No `container.get()` in constructors.
- **Composition root**: `GameServiceRegistry.initializeServices()` wires cross-service handlers.

## Logging

All logging via `EngineLogger` (static, engine-level). **Disabled by default**, enabled via `?debug` URL query param (`main.ts` → `DebugSettings` → `EngineLogger.setEnabled()`). Usage: `EngineLogger.info("Category", "message", ...args)`.

## Performance Optimizations

- **Spatial grid** (`SpatialGrid`): Collision detection bins entities into fixed-size cells. O(n) typical case, down from O(n²) brute-force.
- **Ball rendering**: Radial gradient replaced with two filled circles — zero `CanvasGradient` allocations per frame.
- **Smoke particles**: Delta scaling uses `REFERENCE_DELTA = 1000/60` instead of hardcoded `delta / 16`.

## Remaining Opportunities

1. **Tests** — DI is mockable. Start with `BinaryWriter`/`BinaryReader` and collision math.
2. **Event batching** — Batch multiple remote events per WebRTC message.
3. **`noImplicitOverride`** — Enable in `tsconfig.json` to enforce `override` everywhere.
4. **Spatial grid cell size** — Tuned at 100px; profile and adjust for different entity densities.

## Migration Notes

- **`BaseAnimatedGameEntity`, `BaseStaticCollidingGameEntity`, `BaseDynamicCollidingGameEntity`**: Deleted. Functionality in `BaseMoveableGameEntity` and `BaseCollidingGameEntity`.
- **`LoggerUtils`**: Deleted. Replaced by `EngineLogger`.
- **Physics deprecated fields** (`vx`, `vy`, `mass`, `bounciness`, `rigidBody`): Removed from `BaseCollidingGameEntity`. Entities use `this.physics.*`.
- **`Object.values(this.dataChannels)`**: Cached as `dataChannelValues` in `WebRTCPeerService`.
- **`BallEntity.deserialize()`**: Uses `container.get(GameState).getCanvas()` instead of `document.querySelector`.
