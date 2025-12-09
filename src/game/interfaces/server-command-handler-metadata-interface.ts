import type { WebSocketType } from "../enums/websocket-type.ts";

export interface ServerCommandHandlerMetadata {
  commandId: WebSocketType;
  methodName: string;
  target: object;
}
