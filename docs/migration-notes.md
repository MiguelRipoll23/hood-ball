# Engine/Game Migration Notes

These notes help contributors move legacy core modules into their new engine or game homes while keeping the DI container deterministic.

## Folder expectations
- Engine code belongs under src/engine and must not import from src/game.
- Game code belongs under src/game and should depend on engine contracts instead of concrete engine implementations.
- Shared utilities reside under src/engine when reused by the engine or under src/game when they are gameplay specific. Keep src/core empty as migration progresses.

## Import and alias guidance
- Prefer the upcoming @engine and @game path aliases instead of brittle ../../ relative chains.
- Update existing re-export shims under src/core/services as soon as a module consumes the engine implementation directly.
- When moving a file, search for its old import path and rewrite usages to the new alias before deleting the shim.

## Dependency injection checklist
- Declare dependencies via constructor parameters and @inject decorators. Avoid container.get inside service logic.
- Remove initialize or lazy bootstrap methods; perform setup work in constructors or dedicated factory functions.
- When creating adapters, expose them as value providers from registerGameServices so other services can request them like any dependency.

## Testing expectations
- Run npm run build to confirm TypeScript resolves the new paths.
- Execute npm run smoke:engine after relocating services that touch the engine loop or networking.
- Add focused unit tests when a move changes behaviour or replaces container lookups with explicit constructor wiring.
