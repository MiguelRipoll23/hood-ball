import type { MatchmakingNetworkService } from "../../../services/network/matchmaking-network-service.js";

export interface IMatchmakingService {
  getNetworkService(): MatchmakingNetworkService;
  findOrAdvertiseMatch(): Promise<void>;
  savePlayerScore(): Promise<void>;
  handleGameOver(): Promise<void>;
  renderDebugInformation(context: CanvasRenderingContext2D): void;
}
