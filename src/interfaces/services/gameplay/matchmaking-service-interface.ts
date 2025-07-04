import type { IMatchmakingNetworkService } from "../network/matchmaking-network-service-interface.js";

export interface IMatchmakingService {
  getNetworkService(): IMatchmakingNetworkService;
  findOrAdvertiseMatch(): Promise<void>;
  savePlayerScore(): Promise<void>;
  handleGameOver(): Promise<void>;
  renderDebugInformation(context: CanvasRenderingContext2D): void;
}
