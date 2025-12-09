import type { MultiplayerScene } from "../../scenes/multiplayer-scene.js";
import type { WebRTCPeer } from "../../network/webrtc-peer.js";
import type { BinaryReader } from "../../../utils/binary-reader-utils.js";

export interface IEntityOrchestratorService {
  initialize(): void;
  sendLocalData(
    multiplayerScene: MultiplayerScene,
    deltaTimeStamp: number
  ): void;
  handleEntityData(peer: WebRTCPeer, binaryReader: BinaryReader): void;
}
