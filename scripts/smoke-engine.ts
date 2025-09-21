import { performance } from "node:perf_hooks";
import { createEngineContainer } from "../src/engine/bootstrap/engine-container.js";
import { EngineLoopService } from "../src/engine/loop/engine-loop-service.js";

const noop = () => undefined;

(globalThis as unknown as { window: Window }).window = {
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

let updateCount = 0;

engineLoop.configure({
  canvas,
  context,
  onResize: () => {
    /* no-op */
  },
  callbacks: {
    update: () => {
      updateCount += 1;
    },
    render: () => {
      /* no-op */
    },
  },
});

engineLoop.start();

await new Promise<void>((resolve) => {
  setTimeout(() => {
    engineLoop.stop();
    resolve();
  }, 50);
});

if (updateCount === 0) {
  throw new Error("Engine loop did not execute any update callbacks");
}

console.log("Engine smoke test completed without errors.");
