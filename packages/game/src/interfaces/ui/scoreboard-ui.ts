export interface ScoreboardUI {
  setTimerDuration(durationSeconds: number): void;
  startTimer(): void;
  stopTimer(): void;
  hasTimerFinished(): boolean;
  reset(): void;
  incrementBlueScore(): void;
  incrementRedScore(): void;
  setBlueScore(score: number): void;
  setRedScore(score: number): void;
}
