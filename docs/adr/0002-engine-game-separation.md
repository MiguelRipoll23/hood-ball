# ADR 0002: Separate Engine and Game Service Layers

- Status: Accepted
- Date: 2025-02-14
- Authors: Refactor Working Group
- Context: docs/service-refactor-plan.md

## Context

Historically the Hood Ball project colocated reusable engine code and game-specific logic under 'src/core'. Tight coupling between render loop orchestration, matchmaking services, and state management created circular dependencies that complicated testing, reuse, and future packaging plans. Services routinely pulled collaborators from the global DI container, hid dependencies behind 'initialize()' methods, and imported game enums from engine files. The service separation roadmap now captured in docs/service-refactor-plan.md documents a multi-phase effort to untangle this legacy stack.

## Decision

We are formalizing an engine/game boundary with the following rules:

1. Dedicated bootstrap layers
   - 'src/engine/bootstrap' constructs the DI container and registers engine services only.
   - 'src/game/bootstrap' layers on top to register networking, matchmaking, and UI services, then starts the loop.
2. Contract ownership
   - Shared contracts live under 'src/engine/contracts/**'.
   - Game code adapts domain-specific enums and payloads to those contracts.
3. Dependency direction
   - Engine modules must never import from 'src/game/**'; this is enforced via ESLint and TypeScript path guidance.
   - Game modules depend on engine contracts, not concrete implementations.
4. Explicit lifecycle
   - Constructors declare dependencies via DI; no lazy 'initialize()' methods.
   - Timers, intervals, and scene transitions flow through engine-managed services exposed at bootstrap.
5. State split
   - 'EngineState' encapsulates canvas/input/debug data.
   - 'GameState' wraps 'EngineState' and delegates match/player/session concerns to 'GameSessionState'.

## Consequences

- Positive
  - Engine code becomes reusable and publishable as its own package.
  - Tests can resolve engine services without pulling game modules.
  - Lint and build rules prevent regressions in dependency direction.
  - Game lifecycle is deterministic; removal of lazy init eliminates hidden prerequisites.
- Negative
  - Contributors must update imports when moving modules between layers.
  - Additional adapters introduce minor runtime indirection for events and matchmaking.
  - CI needs extra checks (lint, packaging smoke tests) to enforce the rules.

## Follow-up Actions

- Complete the remaining tasks in docs/service-refactor-plan.md, including packaging the engine workspace and documenting migration steps.
- Add architecture diagrams to the docs portal reflecting the separated bootstrap flow.
- Introduce dependency graph checks (for example 'madge') once packaging lands.
