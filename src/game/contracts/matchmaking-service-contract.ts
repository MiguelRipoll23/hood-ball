import type { MatchmakingNetworkServiceContract } from "./matchmaking-network-service-contract.js";

export interface MatchmakingServiceContract {
  getNetworkService(): MatchmakingNetworkServiceContract;
  findOrAdvertiseMatch(): Promise<void>;
  savePlayerScore(): Promise<void>;
  handleGameOver(): Promise<void>;
  renderDebugInformation(context: CanvasRenderingContext2D): void;
}
