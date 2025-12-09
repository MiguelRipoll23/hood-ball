import type { WebSocketType } from "../enums/websocket-type.js";

export interface ServerCommandHandlerMetadata {
  commandId: WebSocketType;
  methodName: string;
  target: object;
}
