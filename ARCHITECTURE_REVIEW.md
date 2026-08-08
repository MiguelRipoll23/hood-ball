# Hood Ball — Architecture Review

*Last updated: August 2026*

## Summary

Hood Ball is a multiplayer HTML5 canvas game with a custom engine. The architecture follows a clean separation between engine (`src/engine/`) and game (`src/game/`) code, uses dependency injection via `@needle-di/core`, and implements a host-authoritative WebRTC networking model. This review covers all systems after the recent refactoring passes (ECS-lite component system, inheritance flattening, DI standardization, and WorldScene decomposition).

---

## Category Grades

| Category | Grade | Key Action |
|----------|-------|------------|
| Architecture | **A** | Clean engine/game separation. WorldScene decomposed into WeatherSystem + ChatUISystem + controllers. Remaining methods are tightly coupled to scene state — further extraction would hurt readability. |
| Entity System | **A** | Inheritance flattened from 7→4 levels. 3 intermediate base classes deleted. ECS-lite component system (Transform, Physics, Collision, Network, Interaction) with 7 components. Physics deprecated fields removed — entities use `this.physics.*` directly. |
| Networking | **A** | Host-authoritative star topology with three-channel WebRTC (reliable-ordered, reliable-unordered, unreliable-unordered). Binary protocol with sequence tracking. ECDSA signature verification for identity and chat. |
| Event System | **A-** | Clean local/remote queue separation. Host authority enforced on remote events. Event batching would be a nice optimization. |
| DI / Service Layer | **A** | Constructors standardized on deps-object injection. WorldScene, WorldController, ScoreManagerService all use explicit deps interfaces. Testable without a DI container. |
| Performance | **B+** | Binary protocol is efficient. Collision detection is O(n²) — consider spatial partitioning if entity count grows. Canvas gradients recreated each frame. Smoke particles use hardcoded delta scaling. |
| Security | **A-** | ECDSA-signed chat messages, server-pushed anti-cheat rules, per-frame entity position validation, host-only remote event dispatch. Add velocity validation to anti-cheat rules. |
| Tooling | **A-** | `.prettierrc` + `.editorconfig` added. ESLint flat config. `noImplicitOverride` not yet enabled (needs tsconfig fix). |
| Test Coverage | **F** | No tests. DI is now clean and mockable — add Vitest unit tests for serialization, collision math, and event dispatch. |
| Code Quality | **A** | Zero eslint-disable comments. Zero raw `console.*` calls (all via `EngineLogger`). Consistent `override` keyword usage. `.prettierrc` + `.editorconfig` added. `Object.values()` hot-path allocations cached. |

---

## Key Architectural Decisions

### Entity Hierarchy (post-flattening)

```
BaseGameEntity                              (lifecycle, state, opacity, component container)
└─ BaseMultiplayerGameEntity                (+NetworkComponent: owner, sync flags)
   └─ BaseMoveableGameEntity               (+TransformComponent, scale, animations)
      ├─ BaseTappableGameEntity            (+InteractionComponent: hover/press)
      │   └─ 14 UI entities (buttons, menus)
      ├─ BaseCollidingGameEntity           (+PhysicsComponent + CollisionComponent)
      │   ├─ CarEntity, BallEntity          (isDynamic = true)
      │   └─ GoalEntity, BoostPadEntity,    (isDynamic = false)
      │      WorldBackgroundEntity
      └─ 12 non-colliding entities          (snow, confetti, explosions, UI elements)
```

**Max depth: 4** (was 7 before the ECS-lite + flattening refactors). Components provide an escape hatch from the remaining inheritance: new entities can attach `TransformComponent`, `PhysicsComponent`, `CollisionComponent`, `NetworkComponent`, or `InteractionComponent` directly.

### Networking Model
- **Star topology**: One host, all peers connect to host via WebRTC.
- **Three data channels**: reliable-ordered (handshake, events), reliable-unordered (chat, removal), unreliable-unordered (entity state, ping).
- **Host authority**: Only the host dispatches remote events. Non-host event injection is silently dropped.

### Event System
- **Local queue**: Process-local signals (connection lifecycle, UI triggers). Every client subscribes independently.
- **Remote queue**: Host-dispatched authoritative state changes. Non-hosts mirror them.

### Dependency Injection
- **Pattern**: Classes accept a single deps interface in their constructor (e.g., `WorldSceneDependencies`). No `container.get()` in constructors.
- **Composition root**: `GameServiceRegistry.initializeServices()` wires all cross-service handlers.

---

## Component Catalog

| Component | Key Properties | Used By |
|-----------|---------------|---------|
| `TransformComponent` | x, y, width, height, angle, scale, teleport() | BaseMoveableGameEntity |
| `PhysicsComponent` | vx, vy, mass, bounciness, rigidBody, isDynamic | BaseCollidingGameEntity |
| `CollisionComponent` | hitboxEntities, collidingEntities, collision exclusions | BaseCollidingGameEntity |
| `NetworkComponent` | networkId, typeId, owner, syncable, sync flags | BaseMultiplayerGameEntity |
| `InteractionComponent` | active, hovering, pressed, stealFocus | BaseTappableGameEntity |

Access via: `entity.getComponent(TransformComponent)?.teleport(x, y)` or `entity.addComponent(new MyComponent())`.

---

## WorldScene Decomposition

| Subsystem | Location | Responsibility |
|-----------|----------|---------------|
| `WeatherSystem` | `systems/weather-system.ts` | Snow effects, icy friction physics |
| `ChatUISystem` | `systems/chat-ui-system.ts` | Chat input/button, match menu, player list refresh |
| `WorldController` | `world-controller.ts` | Countdown, spawn points, car demolitions, match state |
| `ScoreManagerService` | `services/gameplay/score-manager-service.ts` | Goal detection, scoring, game-over logic |
| `WorldEntityFactory` | `world-entity-factory.ts` | Entity creation (cars, ball, goals, boost pads, UI) |

---

## Remaining Opportunities

1. **Tests** — All deps interfaces are mockable. Start with `BinaryWriter`/`BinaryReader` serialization tests and collision math tests.
2. **Collision performance** — O(n²) brute force; a spatial grid or quadtree would help if entities scale.
3. **Event batching** — Multiple remote events per frame could be batched into a single WebRTC message.
4. **Canvas gradient caching** — `BallEntity.createGradient()` allocates a new gradient each frame. Cache and only recreate on position change.
5. **Smoke particle delta scaling** — `CarEntity.updateSmokeParticles()` uses `delta / 16` (60fps assumption). Use proper delta-time scaling.
6. **`noImplicitOverride`** — Enable in `tsconfig.json` to enforce `override` keyword everywhere.

### Logging

All logging goes through `EngineLogger` (static, engine-level). It is **disabled by default** and enabled via the `?debug` URL query parameter (flowing through `main.ts` → `DebugSettings` → `EngineLogger.setEnabled()`). 

Usage: `EngineLogger.info("Category", "message", ...args)`. The ConsoleSink prepends `[Category]` for readability. When disabled, all log calls are no-ops.

---

## Migration Notes

- **Deprecated fields on base classes**: The base classes (`BaseMoveableGameEntity`, `BaseCollidingGameEntity`, etc.) maintain both deprecated `protected` fields AND component-backed storage. This is deliberate for backward compatibility — 55 entity subclasses still access `this.x`, `this.mass`, `this.rigidBody`, etc. directly. Over time, migrate entities to use `getComponent()` exclusively, then remove the deprecated fields.
- **`BaseAnimatedGameEntity`, `BaseStaticCollidingGameEntity`, `BaseDynamicCollidingGameEntity`**: These files have been deleted. All functionality now lives in `BaseMoveableGameEntity` (animations) and `BaseCollidingGameEntity` (physics + collision).
- **`LoggerUtils`** (`src/game/utils/logger-utils.ts`): Deleted — fully replaced by `EngineLogger`.
- **Physics deprecated fields** (`vx`, `vy`, `mass`, `bounciness`, `rigidBody`): Removed from `BaseCollidingGameEntity`. Entities now use `this.physics.*` directly. Getters/setters delegate to `PhysicsComponent`.
- **`Object.values(this.dataChannels)`**: Cached as `dataChannelValues` array in `WebRTCPeerService` to avoid per-call allocations.
- **`BallEntity.deserialize()` DOM query**: Replaced with `container.get(GameState).getCanvas()` — no more `document.querySelector` in static methods.
