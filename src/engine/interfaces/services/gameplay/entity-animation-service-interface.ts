export interface IEntityAnimationService {
  update(deltaTimeStamp: DOMHighResTimeStamp): void;
  isCompleted(): boolean;
}
