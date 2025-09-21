import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";

export interface IWebSocketService {
  registerCommandHandlers(instance: object): void;
  connectToServer(): void;
  disconnect(): void;
  sendMessage(arrayBuffer: ArrayBuffer): void;
  handleNotificationMessage(binaryReader: BinaryReader): void;
  getOnlinePlayers(): number;
}
