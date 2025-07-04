import type { WebSocketType } from "../../../enums/websocket-type.js";
import type { BinaryReader } from "../../../utils/binary-reader-utils.js";

export interface IWebSocketDispatcherService {
  registerCommandHandlers(instance: any): void;
  dispatchCommand(commandId: WebSocketType, binaryReader: BinaryReader): void;
}
