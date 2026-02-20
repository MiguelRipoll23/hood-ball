export interface WebSocketServiceContract {
  connectToServer(): void;
  disconnect(): void;
  dispose(): void;
  sendMessage(arrayBuffer: ArrayBuffer): void;
  registerCommandHandlers(instance: object): void;
  getOnlinePlayers(): number;
}
