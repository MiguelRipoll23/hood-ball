import type { BinaryReader } from "../../../../engine/utils/binary-reader-utils";

export interface IWebSocketService {
  registerCommandHandlers(instance: object): void;
  connectToServer(): void;
  disconnect(): void;
  sendMessage(arrayBuffer: ArrayBuffer): void;
  handleNotificationMessage(binaryReader: BinaryReader): void;
  getOnlinePlayers(): number;
}
