import type { WebSocketType } from "../../../enums/websocket-type.js";
import type { BinaryReader } from "@engine/utils/binary-reader-utils.js";

export interface IWebSocketDispatcherService {
  registerCommandHandlers(instance: object): void;
  dispatchCommand(commandId: WebSocketType, binaryReader: BinaryReader): void;
}
