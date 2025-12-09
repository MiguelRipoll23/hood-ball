export interface IScoreManagerService {
  updateScoreboard(): void;
  detectScoresIfHost(): void;
  handleRemoteGoal(arrayBuffer: ArrayBuffer | null): void;
  handleRemoteGameOverStartEvent(arrayBuffer: ArrayBuffer | null): void;
}
