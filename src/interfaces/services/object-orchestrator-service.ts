import type { MultiplayerScreen } from "../screen/multiplayer-screen.js";

export interface IObjectOrchestratorService {
  initialize(): void;
  sendLocalData(multiplayerScreen: MultiplayerScreen, deltaTimeStamp: number): void;
}
