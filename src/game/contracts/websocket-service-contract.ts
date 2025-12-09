export interface WebSocketServiceContract {
  connectToServer(): void;
  disconnect(): void;
  sendMessage(arrayBuffer: ArrayBuffer): void;
  registerCommandHandlers(instance: object): void;
  getOnlinePlayers(): number;
}
