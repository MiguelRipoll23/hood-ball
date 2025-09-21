# Engine/Game Service Separation Plan

## Summary
This document captures the current coupling between the reusable engine layer and the Hood Ball game layer, then lays out a detailed refactor roadmap to isolate responsibilities, eliminate lazy initialization, and make startup deterministic. Each section calls out concrete tasks, owners, and risks so work can be scheduled incrementally without breaking the build.

## Current Architecture Snapshot

### Engine vs. Game Responsibility Map
| Area | Current Location | Intended Home | Notes |
| ---- | ---------------- | ------------- | ----- |
| Render/loop orchestration | `src/core/services/gameplay/game-loop-service.ts` | Engine | Should expose callbacks so the game provides scenes without hard imports. |
| Scene management & transitions | `src/core/services/gameplay/scene-*.ts` | Engine | Pure UI orchestration; should depend only on engine contracts. |
| Event queues & consumers | `src/core/services/gameplay/event-*.ts` | Engine | Events should be framed generically; game provides adapters for concrete enums. |
| Game state (match/player/server) | `src/core/models/game-state.ts` | Game | Move to game layer or split to `EngineState` + `GameSession`. |
| Networking & matchmaking | `src/game/services/network/**`, `src/game/services/gameplay/**` | Game | Keep game-specific logic here; expose engine-side interfaces only as needed. |
| Security/crypto | `src/core/services/security/crypto-service.ts` | Game | Relies on server credentials; should not live under engine/core. |

### Coupling Hotspots to Address
- `src/core/services/service-registry.ts:1` imports deep game services, creating a circular dependency between core and game.
- `src/core/services/gameplay/game-loop-service.ts:55` constructs game scenes directly (`MainScene`, `MainMenuScene`) and pulls matchmaking/networking services from the container.
- `src/core/services/gameplay/event-consumer-service.ts:18` and `src/game/services/network/websocket-service.ts:36` rely on `container.get(...)`, hiding true dependencies.
- `src/game/services/gameplay/matchmaking-coordinator.ts:14` chains lazy `initialize()` calls that depend on prior wiring done in `ServiceRegistry.initializeServices()`.
- `src/game/services/network/webrtc-service.ts:39` and `src/game/services/gameplay/entity-orchestrator-service.ts:27` keep mutable state set after construction, making lifecycle reasoning hard.

## Refactor Roadmap

### Phase 1 – Establish Engine Boundary
**Goal:** Create an explicit engine bootstrap that owns rendering, input, and timing without importing game code.

- [x] Create `src/engine/bootstrap/engine-container.ts` that constructs the DI container and registers engine services only (`scene-manager`, `event-queue`, `timer-manager`, etc.).
- [x] Move engine-agnostic services from `src/core/services/gameplay/**` to `src/engine/services/**` and adjust import paths (`EventQueueService`, `TimerManagerService`, `IntervalManagerService`, `SceneTransitionService`, `CameraService`).
- [x] Split `GameState` into `EngineState` (canvas, inputs, frame) and `GameSessionState` (match, server, players) under `src/game/state/`.
- [x] Replace direct scene imports in `game-loop-service.ts` with an injected `GameSceneProvider` interface supplied by the game layer.
- [x] Add ESLint rule (`no-restricted-imports`) preventing `src/engine/**` from importing `src/game/**`.

**Risks:** Engine bootstrap must still expose enough hooks for the existing game to run; schedule smoke tests after this phase.

### Phase 2 – Replace Global Service Registry
**Goal:** Decouple engine registration from game wiring and make bootstrap explicit.

- [x] Delete `src/core/services/service-registry.ts` once engine and game modules exist.
- [x] Add `src/engine/bootstrap/register-engine-services.ts` exporting a pure registration function.
- [x] Add `src/game/bootstrap/register-game-services.ts` that receives the container, registers networking/matchmaking/UI services, and wires adapters.
- [x] Create `src/game/bootstrap/start-game.ts` that executes: `createContainer() -> registerEngine -> registerGame -> resolve orchestrators -> start loop`.
- [x] Update `src/core/services/gameplay/game-loop-service.ts` (or its engine successor) to accept injected collaborators instead of performing container lookups.

**Risks:** Removing the static registry may break implicit bindings; ensure each constructor uses dependency injection annotations before removal.

### Phase 3 – Remove Lazy Initialization and Container Lookups
**Goal:** Ensure services are fully usable after construction and declare dependencies explicitly.

- [x] Refactor `EventProcessorService` to receive `WebRTCServiceContract` via constructor injection; remove `initialize()` and enforce registration during bootstrap.
- [x] Update `EventConsumerService` (`src/core/services/gameplay/event-consumer-service.ts`) to inject `EventQueueService` interfaces instead of calling `container.get(...)`.
- [x] Refactor `WebRTCService` and `WebSocketService` to receive dispatcher/listener dependencies in constructors; drop internal `container.get` usage.
- [x] Replace `MatchmakingCoordinator.initialize()` with eager wiring in constructor or a factory that returns a fully initialized instance.
- [x] Add integration test (or harness) that fails if any service keeps a null dependency placeholder after bootstrap.

**Risks:** Circular dependencies may surface; introduce thin interface wrappers (`IWebRTCCommandRegistrar`, `IEventQueueProvider`) to break cycles.

### Phase 4 – Untangle Cross-Layer Contracts
**Goal:** Define neutral contracts owned by the engine and let the game layer supply concrete implementations.

- [x] Publish `engine` contracts for events, command handlers, matchmaking hooks under `src/engine/contracts/**`.
- [x] Move enums such as `EventType`, `WebRTCType`, and `TunnelType` into game layer and expose adapters translating to engine-friendly identifiers.
- [x] Relocate `CryptoService` and any other game-only utilities to `src/game/services/security/` and update imports.
- [x] Add lint check to verify no engine/core file references `src/game/**`; integrate into CI.
- [x] Document adapter patterns (e.g., how game registers command handlers) in `docs/architecture.md`.

**Risks:** Adapter layer adds indirection; ensure performance-sensitive paths stay lean (e.g., event dispatch).

### Phase 5 – Hardening, Testing, and Documentation
**Goal:** Validate the refactor and codify the layering rules.

- [x] Add smoke test that boots the engine with a stub game module to verify initialization order.
- [x] Add unit/integration coverage for matchmaking bootstrap and WebRTC wiring post-refactor.
- [ ] Audit for remaining singletons (`container`, static maps) and replace with scoped instances if possible.
- [x] Update documentation (`docs/architecture.md`) with diagrams of the new layering and initialization flow.
- [x] Prepare migration notes for contributors (coding guidelines, folder structure expectations).

**Risks:** Test harness may require additional mocks; allocate time to create reusable stubs for network services.

### Phase 6 - Game Loop Cutover
**Goal:** Replace the legacy `GameLoopService` with an engine-owned loop that receives game collaborators explicitly.

- [x] Implement `EngineLoopService` in `src/engine/loop/engine-loop-service.ts` to manage the render/update cycle and window listeners.
- [x] Introduce `GameLoopFacade` in `src/game/loop/game-loop-facade.ts` that wires matchmaking, networking, and scene providers into the engine loop.
- [x] Update `src/core/main.ts` to bootstrap via `createEngineContainer()` plus game registration instead of instantiating `GameLoopService` directly.
- [x] Remove `container.get(...)` calls from loop-related services; provide dependencies through constructors and bootstrap parameters.
- [x] Delete the old `GameLoopService` once parity tests verify scene transitions, matchmaking, and debug overlays.

**Risks:** The cutover touches the render loop and error handling; stage behind a feature flag so QA can fall back to the legacy loop if regressions appear.

### Phase 7 - Core Module Decomposition
**Goal:** Move remaining engine or game primitives out of `src/core` to enforce the layer boundary.

- [x] Audit `src/core/entities/**`, `src/core/models/**`, `src/core/interfaces/**`, and `src/core/utils/**` to decide each module's home. (See docs/core-module-audit.md)
- [x] Relocate engine primitives (entity base classes, frame models, pointer/input handling, debug helpers) into `src/engine/**` with updated imports.
  - In progress: BaseAnimatedGameEntity and the collision stack still rely on the game AnimationType; move once that enum migrates into the engine.
  - Completed: pointer/input contracts, animation types/services, gamepad enums, and binary/debug utilities now live under src/engine/**.
- [x] Push game-specific utilities and enums into src/game/** and expose adapters where engine contracts still need them.
  - Completed: entity-utils and scene-utils now live under src/game/utils/; follow-up adapters will land with the collision refactor.
- [x] Introduce TS/Vite path aliases (e.g., `@engine/*`, `@game/*`) to make layer intent explicit and reduce brittle relative paths.
- [x] Remove temporary re-export shims once imports compile against the new aliases.

**Risks:** Moving shared classes may ripple through dozens of imports; script the migration and run the TypeScript build in watch mode to catch stragglers.

### Phase 8 - Packaging & Deployment Readiness
**Goal:** Treat the engine as a reusable package and harden tooling around the new boundary.

- [x] Publish the engine as an internal npm package or workspace with its own package.json, build targets, and typed exports. (See packages/engine/tsconfig.build.json, packages/engine/package.json, and the aggregated exports in src/engine/index.ts; build via "npm run build:engine".)
- [x] Add a CI smoke build that runs the Hood Ball game against the packaged engine artifact to verify compatibility before release.
- [x] Provide a minimal sample game (or playground) plus docs showing how to embed the engine outside Hood Ball.
- [x] Document versioning and dependency update workflow for the engine package, including how hotfixes flow back into the game repo.
  - Added a detailed "Versioning and dependency workflow" section to `docs/engine-release-guidelines.md` covering bump, build, verification, tagging, and publication steps.
- [x] Automate dependency graph checks (e.g., `madge`) so future changes cannot introduce engine -> game import regressions.
  - Completed via `npm run verify:deps`, which runs `scripts/verify-dependency-boundaries.ts` to flag any direct `src/engine` -> `src/game` imports in the Madge-generated graph.

**Risks:** Packaging introduces versioning overhead; align release cadence with game sprints so engine updates do not block hotfixes.
## Detailed Task Backlog
- [x] Extract `GameLoopService` engine responsibilities into `EngineLoopService`; create `GameLoopFacade` in game layer (`src/game/loop/game-loop-facade.ts`).
- [x] Introduce `EngineContext` interface describing render context, input devices, timing; game layer receives it via dependency injection.
- [x] Migrate `MatchActionsLogService` to depend on engine logging interface instead of direct container usage.
- [x] Replace static `PendingIdentitiesToken` bindings with typed DI tokens registered in game bootstrap.
- [x] Implement custom ESLint rule configuration in `eslint.config.js` enforcing layer boundaries and no `initialize()` exports.
- [x] Create ADR summarizing decision to split engine/game layers (`docs/adr/0002-engine-game-separation.md`).
- [x] Add a runtime feature flag (URL param or config) to toggle between the legacy loop and the new `EngineLoopService` during rollout.
- [ ] Script a codemod to rewrite imports when moving files out of `src/core`, keeping commit diffs manageable.
- [x] Refactor `GameSceneProvider` to rely on engine contracts and constructor injection instead of `@needle-di/core` property lookups.
- [x] Scaffold `packages/engine/package.json` and update root build/test scripts to publish the engine workspace.
- [x] Draft contributor guidelines covering engine release cadence, sample integration, and roll-back procedures once packaging lands.

## Initialization Ordering Blueprint
1. **Create container:** `createEngineContainer()` returns a new `Container` instance with no implicit singletons.
2. **Register engine services:** call `registerEngineServices(container, { canvas, debugging })` to bind render loop, input devices, scene/timer/event services.
3. **Build engine context:** resolve engine state object and pass to game module as a typed interface (no direct class instances).
4. **Register game services:** `registerGameServices(container, engineContext)` binds matchmaking, networking, gameplay-specific services, and adapters needed by the engine.
5. **Finalize wiring:** resolve orchestrators (`EntityOrchestratorService`, `MatchmakingCoordinator`) via a factory that performs any bidirectional registration synchronously.
6. **Start loop:** resolve `EngineLoopService`, pass in the game’s initial scene provider, then call `start()`.

## Dependency Safety Rules
- Engine packages (`src/engine/**`) cannot import from `src/game/**`; enforce via lint rule and TypeScript path mappings.
- Avoid `container.get(...)` outside bootstrap modules; use constructor injection with `@injectable()` and `inject()` decorators.
- No new `initialize()` methods; if cyclic setup is required, introduce mediator services or factories.
- Shared utilities (`BinaryWriter`, `BinaryReader`) stay in engine/core to avoid duplication; game code imports through exposed interfaces.
- Any new service must document whether it belongs to engine or game in its file header comment to aid future reviews.

## Risks & Mitigations
- **Risk:** Moving files may break relative imports. *Mitigation:* update `tsconfig.json` paths and run `tsc --noEmit` after each move.
- **Risk:** DI container scope changes might break runtime resolution. *Mitigation:* add integration test ensuring container can resolve all top-level services after registration.
- **Risk:** Adapter layer adds serialization overhead. *Mitigation:* benchmark event dispatch before/after refactor; optimize critical paths if needed.
- **Risk:** Contributors might reintroduce lazy init. *Mitigation:* add lint rule or review checklist item ensuring constructors perform all setup.

## Immediate Next Actions
1. Draft `createEngineContainer` and `registerEngineServices` modules with current engine services moved from `src/core/services/gameplay/**`.
2. Introduce lint rule configuration rejecting engine -> game imports; run ESLint to inventory current violations before moving files.
3. Prepare ADR and architecture diagram updates to socialize the refactor plan with the team.









