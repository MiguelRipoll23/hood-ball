# Hood Ball — Architecture & Separation of Concerns Review

Date: 2026-08-01
Scope: full client codebase (`src/engine`, `src/game`), reviewed against AAA engineering best practices.

---

## Overall Verdict

**Strong foundation, real problems at the seams.** The engine/game layering, event system, and protocol handling are genuinely well-architected. The main failures are: (1) dependency delivery is inconsistent and unguarded — the global container is reached into from the engine layer and from leaf entities; (2) several god-classes; (3) the replay-mode flag polluting live gameplay code.

Service-locator usage itself is **not** a problem — it is the industry default (see Industry Context). The problem is *where* it is used, not *that* it is used.

---

## What's Done Well

1. **Clean engine/game split** — `src/engine/` is genuinely game-agnostic (base scenes, entity base classes, game loop, DI, binary codecs), `src/game/` holds all game logic. This is the correct layering.

2. **Event-driven decoupling** — The local/remote queue model (`event-processor-service.ts` producers, `event-consumer-service.ts` consumers) cleanly separates who raises events from who reacts. The anti-cheat guard (dropping non-host events) lives in exactly one place (`event-processor-service.ts:52`).

3. **Declarative command handling** — `@PeerCommandHandler` / `@ServerCommandHandler` decorators + dispatchers keep the wire protocol declarative and centralized. Clean.

4. **Contract interfaces + tokens** — `*ServiceContract` interfaces and tokens like `WEB_SOCKET_SERVICE_TOKEN` with `useExisting` bindings is proper dependency inversion.

5. **Dependencies-as-data** — `WorldSceneDependencies`, `WorldControllerDependencies`, `ScoreManagerServiceDependencies` are testable and explicit.

6. **Entity sync separation** — `EntityOrchestratorService` owns network send/receive; entities own `serialize`/`synchronize`. Good division.

---

## Industry Context — Godot / Unity / AAA Engines

Before judging the dependency-delivery mix, here is what the industry actually ships:

- **Godot** — No DI container. Autoload singletons (nodes registered globally, called from anywhere), `get_tree()`/node lookup, exported-property wiring. That is service location plus manual wiring; decoupling comes from signals.
- **Unity** — No built-in DI. `GetComponent`, `FindObjectOfType`, singleton `MonoBehaviour` managers, ScriptableObject event channels. Community DI (Zenject/VContainer) exists but is a minority choice — `MonoBehaviour` construction is engine-restricted, which forces lookup over constructor injection.
- **AAA engines** (Unreal, Frostbite, id Tech, in-house) — `GetWorld()`/`GetGameInstance()`, global service/manager classes. "Service Locator" is a canonical documented pattern (Game Programming Patterns) precisely because it is what the industry converged on.

**Conclusion**: service locator + singletons + event/signal decoupling is the game-industry default; constructor-injection DI containers are the exception. Scenes pulling services from the shared `container` is the direct analogue of Godot autoloads / Unreal `GetGameInstance()` and should stay. The codebase's local/remote event queue is exactly the signal-based decoupling that makes this work. The issues in Problem #1 are **boundary violations**, not locator usage.

---

## Problems — Ranked by Severity

### 1. Dependency delivery: inconsistent and unguarded (not "service locator is wrong")

Per the Industry Context, the service locator itself is fine and should stay. Three things are still wrong:

- **Engine layer reaches into the container.** `base-game-scene.ts:42` (`container.get(CameraService)`), `media-player-entity.ts:19`, `entity-animation-service.ts:10`. The engine is meant to be a clean, self-contained, game-agnostic layer. Making it depend on the application's DI registry inverts the layering — this is worse than any locator concern. **Status:** `base-game-scene` now pulls the camera from `GameState` (which owns the `CameraService` instance the container also binds, so recording still shares one instance) and `media-player-entity` takes `RecordingPlayerService` via constructor — both fixed. `entity-animation-service` now uses an engine-level `animationLogService` singleton — debug instrumentation is global infrastructure (the `UE_LOG`/Unreal Insights analogue), so entities never carry a logger dependency. The container binds `AnimationLogService` via `useValue` to that same instance, so `container.get(AnimationLogService)` and the debug inspector share one registry. The engine layer is now container-free apart from the `ServiceRegistry` composition root.
- **Leaf entities reach into services.** `boost-pad-entity.ts:139,145`, `match-log-entity.ts:269,276,294,299`, `welcome-message-entity.ts:10`, `players-list-entity.ts:25`. Entities are the most serializable, reusable, testable classes in the codebase. A `BoostPadEntity` resolving `MatchSessionService`/`EventProcessorService` from global state means you can't spawn, deserialize, or test it in isolation (in Unity terms: a prefab silently depending on a scene root). Constructor-inject what they need, or route through the event system. **Status:** all four fixed via constructor injection; the factories and `entity-type-registry` (composition roots) supply the services.
- **Three delivery styles with no boundary rule.** `inject()` defaults (`WebRTCService`, `EntityOrchestratorService`, `MatchSessionService`), deps-objects (`WorldScene`, `ScoreManagerService`, `WorldController`), and raw `container.get` coexist with no rule for which is used where. `gameContext` was the same object as `container` under a second name — the alias is **deleted**; `container` is now the single name. **Status:** the boundary rule now maps each style to one creation path — raw `container.get` is reserved for composition roots, `inject()` for container-resolved singletons, deps-objects for manually-constructed gameplay objects — so the coexistence is no longer ungoverned.

**Recommended approach (AAA-pragmatic):**
1. **Keep `@needle-di` and the container.** It is the autoload/singleton registry — the composition root.
2. **Boundary rule:** composition roots (scenes, factories, `GameServiceRegistry`) resolve from `container` freely. Engine internals and entities receive deps via constructor — never from global state.
3. **Wire by creation path, not by whim:** deps-objects for manually-constructed gameplay objects (`WorldScene`, `ScoreManagerService`); `inject()` for container-resolved singletons (`WebRTCService`, `EntityOrchestratorService`). Each style maps to exactly one creation path, and the boundary rule (2) is what prevents mis-use — no need to retire `inject()` or rewrite the container-managed services to deps-objects.
4. **One name for the registry** — the `gameContext` alias is deleted; everything resolves from `container` (**done**).

### 2. God classes

- **`world-scene.ts` (706 lines, ~25 imports)** — scene lifecycle + matchmaking flow + NPC solo-mode + weather physics + chat UI + match menu + scene navigation + DOM access + explosions. It's scene, game-master, and UI coordinator at once.
- **`world-controller.ts` (524 lines)** — countdown, demolitions, spawn management, remote-event deserialization, solo-match transitions. Would split into `CountdownController`, `DemolitionSystem`, `SpawnSystem`.
- **`car-entity.ts` (562 lines)** — physics, rendering, network serialization, demolition, all in one. Should be `CarPhysics` + entity.
- **`score-manager-service.ts`** — mixes scoring rules with UI alerts, match-actions logging, timer scheduling, *and* remote-event emission (`sendGoalEvent`).

### 3. `replayMode` nullability sprawl

`replayMode` and nullable services leak through `world-scene-factory.ts:30-44`, every constructor (`matchmakingService: X | null`), and dozens of `if (this.xService)` guards. WorldScene is trying to serve **two different games** — live multiplayer and replay — and the concerns bleed into every method.

**Fix**: A dedicated replay scene/entity-driver instead of a boolean flag, or Null-Object services, or a separate `WorldScene` subclass. The live path shouldn't be littered with `if (replayMode) return`.

### 4. Hidden side-effects in domain setters

`match-session-service.ts:41` — `setMatchState()` schedules a network re-advertise as a side effect. Match state is pure domain state; re-advertising is matchmaking concern. This couples the two invisibly (and re-advertises even on `GameOver`, `GoalScored` transitions where it's pointless). Prefer an event: matchmaking subscribes to state change.

### 5. Encapsulation leaks in scene entity management

WorldScene bypasses the scene API: direct `this.worldEntities.splice(index, 1)` (`world-scene.ts:355,824`), direct `this.uiEntities.push(...)` (`:544,575,609,617,666`). `BaseGameScene` only exposes `addEntityToSceneLayer` — there's no `addEntityToUILayer`, so every UI entity forces a raw array push. Add the API method and stop mutating arrays externally.

### 6. Duplicated scene navigation

`returnToMainMenuScene` (`world-scene.ts:716`) and `navigateToErrorScene` (`:747`) duplicate the same "new MainScene() → activateScene → load → fadeOutAndIn" flow. Scenes construct other scenes manually (`new MainMenuScene`, `new ErrorScene`) while `WorldScene` alone gets a factory. Only `WorldSceneFactory` exists (`world-scene-factory.ts`); the pattern isn't applied to `LoginScene`, `MainMenuScene`, `SettingsScene`, etc. Centralize navigation behind `SceneManagerService`.

### 7. DOM access from scenes

`world-scene.ts:525` and `:800` query and mutate `#chat-input` directly. The scene should talk to a chat UI entity/service; raw DOM in gameplay scene logic breaks the abstraction.

### 8. Event queue semantics — intentional deferred delivery (not a bug)

`event-consumer-service.ts:80-96` only consumes an event **if at least one subscriber exists**; otherwise it stays pending. This is **intentional**: it lets an event raised during a scene transition be delivered to the screen that subscribes after navigation completes. This is a valid outbox pattern — events are delivered to whatever screen is active when they matter.

Caveats (low priority):
- **Unconsumed events are never pruned** — cleanup at `event-queue-service.ts:37` only removes *consumed* events (when >50 accumulate). An orphaned event raised while no screen is subscribed lives forever. If events can be raised in states where nothing subscribes to them (e.g. menu-only events while a scene is disposed), add a TTL or prune-on-dispatch for unconsumed events to bound memory.
- `consumeLocalEvent.bind(this)` is re-allocated per event per frame (`event-consumer-service.ts:73`) — trivial, but hoist it once.

### 9. Duplication / housekeeping

- `src/utils/jwt-utils.ts` (byte-identical dead duplicate of `src/game/utils/jwt-utils.ts`) — **deleted**. Note: `src/game/utils/jwt-utils.ts` is also unimported (no imports found repo-wide); consider deleting it too if it stays unused.
- `package.json` has no `typecheck`/`test` scripts. **Status:** a `typecheck` script (`tsc --noEmit`) is added and **passes clean (0 errors)**. (The `@needle-di/core@1.1.3` `.d.ts` files were missing from a corrupted npm cache extraction — a forced reinstall restored them.) `eslint.config.js` exists but eslint is intentionally not used — and `typescript-eslint@8.65` has no peer range for TypeScript 7 (`>=4.8.4 <6.1.0`), so linting TS7 with it is unsupported.
- Manual cycle-breaking via `initialize()` (`game-service-registry.ts:147-149`) means nullable fields + `getWebRTCService()` throw guards scattered across services. Works, but is inconsistent with the token-injection used elsewhere; consolidate into an explicit init phase in the composition root.

---

## Recommended Priority Order

1. Enforce a dependency-delivery policy: keep `container` resolution at composition roots (scenes/factories/registry); ban it in engine internals and entities (constructor-inject instead); one name for the registry. **Status:** alias deleted; engine layer (`base-game-scene`, `media-player-entity`, `entity-animation-service`) and leaf entities (`boost-pad`, `match-log`, `welcome-message`, `players-list`) moved off the container; `animation-log-service` is now an engine-level singleton the container binds via `useValue`. The engine layer and all game entities are container-free — only the `ServiceRegistry` composition root touches the container.
2. Split `WorldScene`/`WorldController`/`car-entity` into focused collaborators.
3. Decouple replay mode from live WorldScene (separate scene or null-objects).
4. Move matchmaking side-effects out of `MatchSessionService.setMatchState`.
5. Centralize scene navigation + factories; add `addEntityToUILayer`; remove DOM access from scenes.
6. Event queue: add TTL/prune for unconsumed (orphaned) events; hoist the per-event `bind`.
7. Housekeeping — `src/utils/jwt-utils.ts` deleted (**done**); `typecheck` script added and passing clean (**done**). No eslint/lint tooling — intentionally dropped.
