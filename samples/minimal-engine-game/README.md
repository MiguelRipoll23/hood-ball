# Minimal Engine Playground

This sample demonstrates how to bootstrap the reusable Hood Ball engine without the Hood Ball game
runtime. It wires the exported dependency injection container, configures the `EngineLoopService`, and
runs the update/render callbacks inside a tiny Node.js harness.

## Prerequisites

1. Build the engine workspace so the distributable artifacts exist:
   ```bash
   npm run build:engine
   ```
2. Install the sample's dependencies. The sample links the local workspace package via `file:`
   dependency resolution, so no publication is required:
   ```bash
   cd samples/minimal-engine-game
   npm install
   ```

## Running the sample

- Execute the Node.js harness with `tsx`:
  ```bash
  npm run dev
  ```
  The script stubs the small set of DOM APIs that the engine loop expects, starts the loop, and stops
after a few frames. The console logs how many updates executed, ensuring the engine container wiring
and exported contracts function without the main Hood Ball application.

- To emit compiled JavaScript instead, run:
  ```bash
  npm run build
  node dist/main.js
  ```

## Adapting for the browser

Replace the DOM stubs with a real `HTMLCanvasElement` and the browser's `window` globals before calling
`engineLoop.configure`. The sample intentionally keeps the bootstrap logic isolated so it can be copied
into other applications or demos.
