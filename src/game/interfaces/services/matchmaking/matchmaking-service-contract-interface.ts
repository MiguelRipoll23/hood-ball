import type { MatchmakingNetworkServiceContract } from "./matchmaking-network-service-contract-interface.js";
import type { WebRTCService } from "../../../services/network/webrtc-service.js";

export interface MatchmakingServiceContract {
  getNetworkService(): MatchmakingNetworkServiceContract;
  getWebRTCService(): WebRTCService;
  findOrAdvertiseMatch(): Promise<void>;
  savePlayerScore(): Promise<void>;
  handleGameOver(): Promise<void>;
  renderDebugInformation(context: CanvasRenderingContext2D): void;
}
