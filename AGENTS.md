# AGENTS.md

## Purpose

Define clear layering, dependency rules, and TypeScript naming conventions so agents/services remain modular, testable, and free of circular dependencies.

---

## TL;DR (Rules You Must Remember)

- **Domain is pure** (no HTTP, DB, FS, or framework code).
- **Application depends on Domain;** it orchestrates use cases and workflows.
- **Infrastructure depends on Domain contracts only** (to implement them). It must **not** be imported by Domain or Application.
- **No circular dependencies** anywhere.
- **Cross-layer communication** happens via **contracts (interfaces/types)** and **domain events** published on the **EventBus**.
- **TypeScript interfaces have no `I` prefix**. Use a suffix like `Contract` or `Port` to avoid name collisions with concrete services.

---

## Architecture & Allowed Dependencies

```
[Domain]  ←  [Application]
   ↑
   └────────── [Infrastructure]  (imports Domain contracts only)
```

## Directory Layout

- `src/domain/**` — **Domain layer.** Keep business entities, value objects, domain events, and contracts here only.
  Avoid infrastructure or framework-specific code in this tree.
- `src/application/**` — **Application layer.** House use cases, orchestrators, and domain event handlers here.
  These modules may import from `src/domain` exclusively.
- `src/infrastructure/**` — **Infrastructure layer.** Put implementations of domain contracts, adapters, and
  composition-root wiring in this directory. These files may depend on `src/domain` but never on `src/application`.
- `src/shared/**` — Use sparingly for cross-layer utilities that must stay free of infrastructure concerns. Duplicate
  small helpers per layer whenever that avoids breaking dependency rules.

**Allowed**
- `Application → Domain`
- `Infrastructure → Domain` (to implement contracts)

**Forbidden**
- `Domain → Application` or `Domain → Infrastructure`
- `Application → Infrastructure`
- **Any circular dependency**

> Rationale: Domain declares the *what* (business rules + contracts). Application coordinates *when/why*. Infrastructure provides the *how* for technical concerns.

---

## Layer Responsibilities

### Domain
- **Pure business logic**: entities, value objects, domain services, domain events.
- **Contracts** for external capabilities (repositories, gateways, event bus).
- **No side effects to infrastructure**.
- **Examples**
  - Entities/VOs: `Match`, `Score`, `TeamId`
  - Services: `ScoreCalculator`
  - Contracts: `MatchRepositoryContract`, `ClockContract`
  - Events: `MatchCreatedEvent`

### Application
- **Use cases and orchestration**; coordinates domain operations.
- Depends **only** on Domain.
- **Examples**
  - Use cases: `CreateMatchUseCase`, `UpdateScoreUseCase`
  - Subscribers/handlers for domain events (pure orchestration)

### Infrastructure
- **Implementations of domain contracts** and integration with external systems (DB, HTTP, queues, caches, etc.).
- Imports **Domain** (to implement contracts), but **never** Application.
- **Examples**
  - Repositories: `DatabaseMatchRepository`
  - Gateways: `HttpScoreGateway`
  - Message bus adapter: `NodeEventBus`

---

## Communication Across Layers

- **Contracts (interfaces/types) in Domain**
  - Examples: `MatchRepositoryContract`, `ScoreRepositoryContract`, `EventBusContract`
- **Events**
  - Domain raises events; Application subscribes (or publishes) via `EventBusContract`.
- **Dependency Injection (DI)**
  - Application depends on **contracts**, not implementations.
  - Infrastructure binds implementations to contracts at composition root.

---

## TypeScript Naming Conventions

### General
- **Classes / Types / Interfaces**: `PascalCase`
- **Variables / Functions**: `camelCase`
- **Files**: `kebab-case` (one public type per file is preferred)
- **Exports**: Prefer **named exports** over `default` to reduce import ambiguities.

### Interfaces Without `I` Prefix
- Do **not** use `I` prefix (e.g., `IMatchRepository`). Instead, suffix with **`Contract`** or **`Port`**:
  - ✅ `MatchRepositoryContract`
  - ✅ `ScoreGatewayPort`

### Avoiding Name Collisions With Services
- **Never** give an interface the same name as a concrete class.
- Good pattern:
  - `MatchRepositoryContract` (Domain contract)
  - `DatabaseMatchRepository` (Infrastructure implementation)
  - `CreateMatchUseCase` (Application use case)

> This keeps imports explicit and avoids shadowing or refactor hazards.

---

## Minimal Code Examples

### Domain — Contract & Entity

```ts
// src/domain/contracts/match-repository-contract.ts
export interface MatchRepositoryContract {
  save(match: Match): Promise<void>;
  findById(id: string): Promise<Match | null>;
}

// src/domain/entities/match.ts
export class Match {
  constructor(
    public readonly id: string,
    public homeScore: number,
    public awayScore: number
  ) {}

  updateScore(home: number, away: number): void {
    this.homeScore = home;
    this.awayScore = away;
  }
}
```

### Application — Use Case

```ts
// src/application/use-cases/create-match-use-case.ts
import { Match } from "../../domain/entities/match";
import { MatchRepositoryContract } from "../../domain/contracts/match-repository-contract";

type CreateMatchInput = { id: string; homeScore?: number; awayScore?: number };

export class CreateMatchUseCase {
  constructor(private readonly matchRepository: MatchRepositoryContract) {}

  async execute(input: CreateMatchInput): Promise<void> {
    const match = new Match(input.id, input.homeScore ?? 0, input.awayScore ?? 0);
    await this.matchRepository.save(match);
    // Optionally publish a domain event via EventBusContract here.
  }
}
```

### Infrastructure — Implementation

```ts
// src/infrastructure/repositories/database-match-repository.ts
import { Match } from "../../domain/entities/match";
import { MatchRepositoryContract } from "../../domain/contracts/match-repository-contract";

export class DatabaseMatchRepository implements MatchRepositoryContract {
  // This is a placeholder; swap with your DB client.
  private readonly store = new Map<string, Match>();

  async save(match: Match): Promise<void> {
    this.store.set(match.id, match);
  }

  async findById(id: string): Promise<Match | null> {
    return this.store.get(id) ?? null;
  }
}
```

### Event Bus Contract & Sample Event

```ts
// src/domain/contracts/event-bus-contract.ts
export interface EventBusContract {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(eventName: string, handler: (event: T) => Promise<void>): void;
}

export interface DomainEvent {
  name: string;
  occurredAt: Date;
}

// src/domain/events/match-created-event.ts
import { DomainEvent } from "../contracts/event-bus-contract";

export class MatchCreatedEvent implements DomainEvent {
  readonly name = "MatchCreated" as const;
  constructor(public readonly matchId: string, public readonly occurredAt: Date = new Date()) {}
}
```

### Composition Root (Wiring) — No Manual Fetching, No Cycles

```ts
// src/app-bootstrap.ts (composition root)
import { DatabaseMatchRepository } from "./infrastructure/repositories/database-match-repository";
import { CreateMatchUseCase } from "./application/use-cases/create-match-use-case";
// import { EventBusContract } from "./domain/contracts/event-bus-contract";
// const eventBus: EventBusContract = ... // provide an implementation in Infrastructure

export function buildApp() {
  const matchRepository = new DatabaseMatchRepository();
  const createMatch = new CreateMatchUseCase(matchRepository);
  return { createMatch };
}
```

> **Important:** Only the composition root knows about Infrastructure. Application and Domain never import from Infrastructure.

---

## Anti‑Patterns to Avoid

- ❌ Importing from **Infrastructure** anywhere except the **composition root**.
- ❌ Domain importing Application or Infrastructure.
- ❌ Application importing Infrastructure.
- ❌ Barrels (`index.ts`) that accidentally re-export across layers and create cycles.
- ❌ Service locators / global singletons that hide dependencies.
- ❌ Interfaces named the same as their concrete implementations.

---

## PR Checklist (Copy into your PR template)

- [ ] The code respects allowed dependency directions.
- [ ] New or changed services depend on **contracts** only.
- [ ] No imports from Infrastructure in Domain/Application.
- [ ] No circular dependencies (run your linter/TS plugin).
- [ ] Interface names **do not** use `I` prefix and **do** use `Contract`/`Port` suffixes.
- [ ] Examples and docs updated when patterns changed.

---

## Quick Reference

- **Domain**: business rules + contracts + events. No side effects.
- **Application**: orchestrates use cases; imports Domain only.
- **Infrastructure**: implements contracts; imports Domain only.
- **Interfaces**: `PascalCase` + `Contract|Port` suffix. No `I` prefix.
- **Wiring**: done in the composition root. Inject contracts.
