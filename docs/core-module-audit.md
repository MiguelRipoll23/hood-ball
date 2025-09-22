# Engine/Game Module Decomposition Status

Updated 2025-02-16 after dissolving the legacy packages/core module.

All former core entities, scenes, and utilities now live in their respective
packages:

- Shared engine primitives (entities, animation/event models, scene contracts)
  reside under packages/engine/src.
- Game-specific abstractions (scene bases, UI/debug windows, session state)
  reside under packages/game/src.
- The application entry point (src/main.ts) bootstraps the game package
  directly; no separate core layer remains.

Future clean-up work should focus on refining engine/game boundaries rather than
migrating from a third package. Keep this note as the source of truth for the
post-core layout.
