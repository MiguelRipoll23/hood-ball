export interface ScoreManagerServiceContract {
  updateScoreboard(): void;
  detectScoresIfHost(): void;
  handleRemoteGoal(arrayBuffer: ArrayBuffer | null): void;
  handleRemoteGameOverStartEvent(arrayBuffer: ArrayBuffer | null): void;
}
