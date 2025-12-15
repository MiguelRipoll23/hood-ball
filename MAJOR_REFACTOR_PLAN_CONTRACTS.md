# Major Refactor Plan: Solving Circular Dependencies and Architectural Issues (Contract Suffix Edition)

## 1. Problem Analysis

The current codebase suffers from significant circular dependency issues,
primarily due to:

1. **Tight Coupling between Engine and Game:** The `src/engine` and `src/game`
   directories are not strictly layered. `src/game` depends on `src/engine`
   (expected), but `src/engine` services often depend on specific
   implementations or types that are conceptually part of the game logic, or
   vice-versa where game services depend on engine services that then depend
   back on game-specific types (like `GamePlayer` or `MatchSessionService`).
2. **Bidirectional Service Dependencies:** Many services inject each other. For
   example:
   - `MatchmakingService` depends on `MatchFinderService`,
     `MatchmakingNetworkService`, `MatchLifecycleService`,
     `MatchSessionService`.
   - `MatchmakingNetworkService` depends on `MatchSessionService`,
     `TimerManagerService`, `GamePlayer`.
   - `MatchFinderService` depends on `MatchSessionService`, `GamePlayer`,
     `GameServer`.
   - `MatchSessionService` is a central state holder but is injected into
     services that it might logically depend on for updates.
3. **God Objects / Central Registries:** `ServiceRegistry` and
   `GameServiceRegistry` import _everything_ to register them. While this is
   common for DI roots, the fact that these files are in `src/engine` and
   `src/game` respectively and import from each other's domains creates a cycle
   if any service imported by `ServiceRegistry` imports something from
   `src/game`.
4. **"Defer" and "Lazy" Workarounds:** The codebase uses `defer` in script tags
   and manual deferral in code (e.g., `BaseGameScene` pointer handling) to work
   around initialization order issues.
5. **Mixed Concerns:** `GameState` holds references to `GameFrame`,
   `GamePointer`, etc., but is also injected into almost every service. If
   `GameState` imports anything that eventually imports a service that needs
   `GameState`, a cycle is formed.

## 2. Architectural Goals

1. **Strict Layering:**
   - **Core/Engine Layer:** Generic game engine code (rendering, input, basic
     entity management, event bus, DI container). _Must not import from Game
     Layer._
   - **Game State/Model Layer:** Pure data models and state holders (User,
     Match, Settings). _Must not import from Service or View Layers._
   - **Service Layer:** Business logic (Matchmaking, Networking, API). Can
     import Core and Model.
   - **View/Scene Layer:** UI, Scenes, Entities. Can import all above.
   - **Application Root:** Entry point that wires everything together.

2. **Dependency Inversion & Naming Conventions:**
   - Services should depend on _interfaces_, not concrete classes.
   - Interfaces should be defined in a separate, lower-level module (e.g.,
     `src/core/contracts` or `src/models/contracts`) to break cycles.
   - **Naming Convention:** Use the `Contract` suffix for interfaces (e.g.,
     `MatchmakingServiceContract`) instead of the `I` prefix. This aligns with
     existing patterns like `WebRTCServiceContract` and avoids the Hungarian
     notation `I` prefix which is often discouraged in TypeScript.

3. **Event-Driven Architecture:**
   - Reduce direct service-to-service calls. Use the `EventProcessorService` /
     `EventConsumerService` (or a new `EventBus`) to decouple components.
   - Service A fires an event; Service B listens. Service A doesn't need to know
     Service B exists.

## 3. Refactoring Steps

### Phase 1: Interface Extraction & Relocation (The "Breaker" Phase)

- **Goal:** Break immediate import cycles by moving interfaces to a neutral
  location.
- **Action:**
  - Create `src/contracts` (or `src/core/contracts`).
  - Move all service interfaces to this folder and rename them using the
    `Contract` suffix.

### Phase 2: Engine vs. Game Separation

- **Goal:** Ensure `src/engine` never imports from `src/game`.
- **Action:**
  - Audit `src/engine`. Any import from `../game/...` is a violation.
  - If `src/engine` needs game logic, define a contract in
    `src/engine/contracts` and implement it in `src/game`. Inject the
    implementation at runtime.
  - Example: If `GameLoopService` (Engine) needs to know about `MatchSession`
    (Game), abstract `MatchSession` into a generic `SessionContextContract` in
    Engine.

### Phase 3: Service Decoupling

- **Goal:** Remove circular dependencies between services.
- **Action:**
  - **Identify Cycles:** Use `madge` or similar tools to visualize cycles.
  - **Refactor `MatchmakingService` cluster:**
    - `MatchmakingService` seems to be a coordinator. It should depend on
      lower-level services (`Network`, `Finder`).
    - Lower-level services should _not_ depend on `MatchmakingService`.
    - If `MatchmakingNetworkService` needs to notify `MatchmakingService`, use
      Events or Observables, not direct injection.
  - **Refactor `MatchSessionService`:**
    - This should be a pure state holder (Model). It should not have complex
      logic or dependencies on Network services.
    - Services update `MatchSessionService`; `MatchSessionService` just holds
      data.

### Phase 4: DI Configuration Cleanup

- **Goal:** Centralize and simplify DI setup.
- **Action:**
  - Move `ServiceRegistry` and `GameServiceRegistry` to a dedicated `src/config`
    or `src/startup` folder.
  - Ensure these registry files are the _only_ places where concrete
    implementations are coupled.
  - Avoid `useClass` if `useValue` or `useFactory` can break a cycle during
    instantiation.

### Phase 5: Folder Structure Reorganization

## 4. Immediate Action Items (The "Fix It Now" List)

1. **Fix `MatchmakingService` <-> `MatchmakingNetworkService`:**
   - Extract `MatchmakingNetworkServiceContract` to `src/contracts`.
   - Make `MatchmakingService` depend on `MatchmakingNetworkServiceContract`.
   - Remove `MatchmakingService` dependency from `MatchmakingNetworkService`. If
     `MatchmakingNetworkService` needs to trigger matchmaking logic, use an
     Event.

2. **Fix `GamePlayer` / `MatchSessionService` Dependencies:**
   - Ensure these are "Leaf" dependencies (they don't depend on other services).
   - If they need to trigger side effects, move that logic to a "Manager"
     service that orchestrates the state change.

3. **Consolidate DI:**
   - Stop importing `container` directly in classes. Always use constructor
     injection (`@inject`).
   - Only use `container.get()` in the Composition Root (`main.ts` or
     factories).

4. **Remove `lazy` hacks:**
