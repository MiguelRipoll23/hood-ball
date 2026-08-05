import { InjectionToken } from "@needle-di/core";
import type { MatchmakingNetworkServiceContract } from "./matchmaking-network-service-contract-interface.js";

export interface MatchmakingServiceContract {
  getNetworkService(): MatchmakingNetworkServiceContract;
  findOrAdvertiseMatch(): Promise<void>;
  savePlayerScore(): Promise<void>;
  handleGameOver(): Promise<void>;
  leaveMatch(): Promise<void>;
  renderDebugInformation(context: CanvasRenderingContext2D): void;
}

export const MATCHMAKING_SERVICE_TOKEN =
  new InjectionToken<MatchmakingServiceContract>("MatchmakingServiceContract");

