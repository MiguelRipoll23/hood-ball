import type { MultiplayerScreen } from "../../screens/multiplayer-screen.js";
import type { WebRTCPeer } from "../../webrtc-peer.js";
import type { BinaryReader } from "../../../core/utils/binary-reader-utils.js";

export interface IEntityOrchestratorService {
  initialize(): void;
  sendLocalData(multiplayerScreen: MultiplayerScreen, deltaTimeStamp: number): void;
  handleObjectData(peer: WebRTCPeer, binaryReader: BinaryReader): void;
}
