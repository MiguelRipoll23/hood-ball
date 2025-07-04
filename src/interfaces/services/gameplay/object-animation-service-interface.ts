export interface IObjectAnimationService {
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  isCompleted(): boolean;
}
