export interface EntityAnimationServiceContract {
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  isCompleted(): boolean;
}
