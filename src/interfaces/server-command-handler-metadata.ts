import type { WebSocketType } from "../enums/websocket-type";

export interface ServerCommandHandlerMetadata {
  commandId: WebSocketType;
  methodName: string;
  target: object;
}
