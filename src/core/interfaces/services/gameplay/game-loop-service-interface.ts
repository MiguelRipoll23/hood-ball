export interface IGameLoopService {
  getCanvas(): HTMLCanvasElement;
  start(): void;
  stop(): void;
}
