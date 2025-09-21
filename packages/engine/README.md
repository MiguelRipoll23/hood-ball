# Hood Ball Engine Package

This workspace packages the reusable engine layer so it can be consumed by other applications. The build currently emits compiled JavaScript and declaration files under packages/engine/dist using the src/engine/index.ts barrel for exports.

## Building


> hood-ball@1.0.0 build:engine
> npm run build --prefix packages/engine


> @hood-ball/engine@0.0.0-dev build
> tsc -p tsconfig.build.json && node ../../scripts/prune-engine-dist.mjs

This runs tsc -p packages/engine/tsconfig.build.json to compile the engine sources and prunes non-engine output. (Node 20.19+ is required for the Vite/Rollup dependency tree.)

## Exports

The package exposes container bootstrap helpers, loop services, animation utilities, input contracts, and common engine utilities via the barrel file at src/engine/index.ts.

Follow-up work is tracked in docs/service-refactor-plan.md to peel the remaining collision hierarchy and provide a leaner set of public entry points.
