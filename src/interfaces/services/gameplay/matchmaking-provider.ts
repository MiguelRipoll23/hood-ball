export interface IMatchmakingProvider {
  findOrAdvertiseMatch(): Promise<void>;
  handleGameOver(): Promise<void>;
  savePlayerScore(): Promise<void>;
}
