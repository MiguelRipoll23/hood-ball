import { injectable } from "@needle-di/core";

export type EngineLoopCallbacks = {
  onBeforeStart?: () => void;
  beforeUpdate?: (deltaTime: DOMHighResTimeStamp) => void;
  update: (deltaTime: DOMHighResTimeStamp) => void;
  render: (context: CanvasRenderingContext2D) => void;
  afterRender?: (context: CanvasRenderingContext2D) => void;
  onSecondElapsed?: () => void;
};

export type EngineLoopConfiguration = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  onResize: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => void;
  callbacks: EngineLoopCallbacks;
};

@injectable()
export class EngineLoopService {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private callbacks: EngineLoopCallbacks | null = null;

  private resizeListener: (() => void) | null = null;
  private resizeListenerAttached = false;
  private frameRequest: number | null = null;

  private running = false;
  private previousTimestamp: DOMHighResTimeStamp | null = null;
  private elapsedMilliseconds = 0;
  private currentFPS = 0;

  public configure(configuration: EngineLoopConfiguration): void {
    if (this.canvas !== null) {
      throw new Error("EngineLoopService has already been configured");
    }

    this.canvas = configuration.canvas;
    this.context = configuration.context;
    this.callbacks = configuration.callbacks;

    this.resizeListener = () => {
      configuration.onResize(this.canvas!, this.context!);
    };

    window.addEventListener("resize", this.resizeListener);
    this.resizeListenerAttached = true;

    configuration.onResize(this.canvas, this.context);
  }

  public start(): void {
    if (this.running) {
      return;
    }

    if (this.canvas === null || this.context === null || this.callbacks === null) {
      throw new Error("EngineLoopService must be configured before calling start()");
    }

    if (this.resizeListener !== null && this.resizeListenerAttached === false) {
      window.addEventListener("resize", this.resizeListener);
      this.resizeListenerAttached = true;
    }

    this.running = true;
    this.previousTimestamp = null;
    this.elapsedMilliseconds = 0;

    this.callbacks.onBeforeStart?.();

    this.requestNextFrame();
  }

  public stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.frameRequest !== null) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }

    if (this.resizeListener !== null && this.resizeListenerAttached) {
      window.removeEventListener("resize", this.resizeListener);
      this.resizeListenerAttached = false;
    }
  }

  public getCanvas(): HTMLCanvasElement {
    if (this.canvas === null) {
      throw new Error("EngineLoopService is not configured");
    }
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    if (this.context === null) {
      throw new Error("EngineLoopService is not configured");
    }
    return this.context;
  }

  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  private requestNextFrame(): void {
    this.frameRequest = requestAnimationFrame(this.loop);
  }

  private readonly loop = (timestamp: DOMHighResTimeStamp) => {
    if (!this.running || this.context === null || this.callbacks === null) {
      return;
    }

    let deltaTime: DOMHighResTimeStamp = 0;

    if (this.previousTimestamp !== null) {
      deltaTime = Math.min(timestamp - this.previousTimestamp, 100);
      this.currentFPS = deltaTime > 0 ? 1000 / deltaTime : 0;
    } else {
      this.currentFPS = 0;
    }

    this.previousTimestamp = timestamp;
    this.elapsedMilliseconds += deltaTime;

    if (this.elapsedMilliseconds >= 1_000) {
      this.elapsedMilliseconds %= 1_000;
      this.callbacks.onSecondElapsed?.();
    }

    this.callbacks.beforeUpdate?.(deltaTime);
    this.callbacks.update(deltaTime);
    this.callbacks.render(this.context);
    this.callbacks.afterRender?.(this.context);

    if (this.running) {
      this.requestNextFrame();
    }
  };
}
