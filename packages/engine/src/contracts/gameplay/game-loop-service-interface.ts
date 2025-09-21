export interface GameLoopServiceContract {
  getCanvas(): HTMLCanvasElement;
  start(): void;
  stop(): void;
}
