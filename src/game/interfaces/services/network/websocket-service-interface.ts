export interface IWebSocketService {
  registerCommandHandlers(instance: any): void;
  connectToServer(): void;
  sendMessage(arrayBuffer: ArrayBuffer): void;
  handleNotificationMessage(binaryReader: any): void;
}
