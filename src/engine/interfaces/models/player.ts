export interface Player {
  getId(): string;
  getNetworkId(): string;
  getName(): string;
  isHost(): boolean;
}
