import { injectable } from "@needle-di/core";
import { EngineLoopService } from "@engine/loop/engine-loop-service.js";
import type { GameLoopServiceContract } from "@engine/contracts/gameplay/game-loop-service-interface.js";
import { GameLoopPipeline } from "./game-loop-pipeline.js";

export type GameLoopFacadeInitializationOptions = {
  canvas: HTMLCanvasElement;
  debugging: boolean;
};

@injectable()
export class GameLoopFacade implements GameLoopServiceContract {
  private canvas: HTMLCanvasElement | null = null;
  private initialized = false;

  constructor(
    private readonly engineLoopService: EngineLoopService,
    private readonly pipeline: GameLoopPipeline
  ) {}

  public initialize(options: GameLoopFacadeInitializationOptions): void {
    if (this.initialized) {
      throw new Error("GameLoopFacade has already been initialized");
    }

    const context = this.obtainContext(options.canvas);
    const configuration = this.pipeline.setup({
      canvas: options.canvas,
      context,
      debugging: options.debugging,
      getCurrentFPS: () => this.engineLoopService.getCurrentFPS(),
    });

    this.engineLoopService.configure({
      canvas: options.canvas,
      context,
      onResize: configuration.onResize,
      callbacks: configuration.callbacks,
    });

    this.canvas = options.canvas;
    this.initialized = true;
  }

  public start(): void {
    if (!this.initialized) {
      throw new Error("GameLoopFacade must be initialized before calling start()");
    }

    this.engineLoopService.start();
  }

  public stop(): void {
    if (!this.initialized) {
      return;
    }

    this.engineLoopService.stop();
    this.pipeline.destroy();
    this.initialized = false;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.requireCanvas();
  }

  private obtainContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Unable to acquire 2D rendering context");
    }

    return context;
  }

  private requireCanvas(): HTMLCanvasElement {
    if (this.canvas === null) {
      throw new Error("GameLoopFacade has not been initialized");
    }

    return this.canvas;
  }
}
