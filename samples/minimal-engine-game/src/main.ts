import { performance } from "node:perf_hooks";
import { createEngineContainer, EngineLoopService } from "@hood-ball/engine";

/**
 * Minimal bootstrap demonstrating how to embed the reusable engine without the Hood Ball game.
 * The sample stubs out the browser APIs expected by the engine loop so the example can run in Node.js
 * and focus on the DI + configuration contract.
 */
const noop = () => undefined;

(globalThis as { window?: Window }).window = {
  addEventListener: noop,
  removeEventListener: noop,
  setTimeout,
  clearTimeout,
} as unknown as Window;

(globalThis.requestAnimationFrame as unknown) = (callback: FrameRequestCallback) => {
  const id = setTimeout(() => callback(performance.now()), 16) as unknown as number;
  return id;
};

(globalThis.cancelAnimationFrame as unknown) = (handle: number) => {
  clearTimeout(handle as unknown as NodeJS.Timeout);
};

const context = {
  clearRect: noop,
  beginPath: noop,
  arc: noop,
  closePath: noop,
  fill: noop,
  save: noop,
  restore: noop,
} as unknown as CanvasRenderingContext2D;

const canvas = {
  width: 800,
  height: 600,
  style: {},
  getContext: () => context,
  addEventListener: noop,
  removeEventListener: noop,
} as unknown as HTMLCanvasElement;

const container = createEngineContainer();
const engineLoop = container.get(EngineLoopService);
let frameCount = 0;

engineLoop.configure({
  canvas,
  context,
  onResize: () => {
    /* no-op */
  },
  callbacks: {
    update: () => {
      frameCount += 1;
    },
    render: () => {
      /* no-op */
    },
  },
});

engineLoop.start();

setTimeout(() => {
  engineLoop.stop();
  console.log(`Engine loop executed ${frameCount} updates in the sample runtime.`);
}, 100);
