import { AnimationType } from "../../enums/animation-type.js";
import { ObjectAnimationService } from "../../services/object-animator-service.js";
import { BaseMoveableGameObject } from "./base-moveable-game-object.js";

export class BaseAnimatedGameObject extends BaseMoveableGameObject {
  protected scale: number = 1;

  protected animations: ObjectAnimationService[] = [];

  constructor() {
    super();
  }

  public getScale(): number {
    return this.scale;
  }

  public setScale(scale: number): void {
    this.scale = scale;
  }

  public fadeIn(seconds: number): void {
    this.animations.push(
      new ObjectAnimationService(this, AnimationType.FadeIn, 0, 1, seconds)
    );
  }

  public fadeOut(seconds: number): void {
    this.animations.push(
      new ObjectAnimationService(this, AnimationType.FadeOut, 1, 0, seconds)
    );
  }

  public moveToX(newX: number, seconds: number) {
    this.animations.push(
      new ObjectAnimationService(
        this,
        AnimationType.MoveX,
        this.x,
        newX,
        seconds
      )
    );
  }

  public moveToY(newY: number, seconds: number) {
    this.animations.push(
      new ObjectAnimationService(
        this,
        AnimationType.MoveY,
        this.y,
        newY,
        seconds
      )
    );
  }

  public rotateTo(newAngle: number, seconds: number) {
    this.animations.push(
      new ObjectAnimationService(
        this,
        AnimationType.Rotate,
        this.angle,
        newAngle,
        seconds
      )
    );
  }

  public scaleTo(newScale: number, seconds: number) {
    this.animations.push(
      new ObjectAnimationService(
        this,
        AnimationType.Scale,
        this.scale,
        newScale,
        seconds
      )
    );
  }

  public reset(): void {
    this.animations.length = 0;
    super.reset();
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    this.animations.forEach((animation) => {
      animation.update(deltaTimeStamp);

      // Remove completed animations
      if (animation.isCompleted()) {
        const index = this.animations.indexOf(animation);
        this.animations.splice(index, 1);
      }
    });

    super.update(deltaTimeStamp);
  }
}
