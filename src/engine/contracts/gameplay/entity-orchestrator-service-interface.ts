import type { MultiplayerScene } from "../../../core/interfaces/scenes/multiplayer-scene.js";
import type { EngineWebRTCPeer } from "../network/webrtc-peer.js";
import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";

export interface IEntityOrchestratorService {
  initialize(): void;
  sendLocalData(
    multiplayerScene: MultiplayerScene,
    deltaTimeStamp: number
  ): void;
  handleEntityData(peer: EngineWebRTCPeer, binaryReader: BinaryReader): void;
}
