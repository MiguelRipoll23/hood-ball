import type { MultiplayerScene } from "../../scenes/multiplayer-scene-interface.js";
import type { WebRTCPeer } from "../../network/webrtc-peer-interface.js";
import type { BinaryReader } from "../../../utils/binary-reader-utils.js";

export interface EntityOrchestratorServiceContract {
  initialize(): void;
  sendLocalData(
    multiplayerScene: MultiplayerScene,
    deltaTimeStamp: number
  ): void;
  handleEntityData(peer: WebRTCPeer, binaryReader: BinaryReader): void;
}
