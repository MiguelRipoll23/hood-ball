import { InjectionToken } from "@needle-di/core";

export interface WebSocketServiceContract {
  connectToServer(): void;
  disconnect(): void;
  dispose(): void;
  sendMessage(arrayBuffer: ArrayBuffer): void;
  registerCommandHandlers(instance: object): void;
  getOnlinePlayers(): number;
  getUserSignature(): ArrayBuffer | null;
}

export const WEB_SOCKET_SERVICE_TOKEN =
  new InjectionToken<WebSocketServiceContract>("WebSocketServiceContract");
