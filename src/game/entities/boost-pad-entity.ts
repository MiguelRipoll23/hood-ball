import { BaseStaticCollidingGameEntity } from "../../core/entities/base-static-colliding-game-entity.js";
import { HitboxEntity } from "../../core/entities/hitbox-entity.js";
import { LIGHT_GREEN_COLOR } from "../constants/colors-constants.js";

export class BoostPadEntity extends BaseStaticCollidingGameEntity {
  private readonly SIZE = 40;

  constructor(private startX: number, private startY: number) {
    super();
    this.x = this.startX;
    this.y = this.startY;
    this.width = this.SIZE;
    this.height = this.SIZE;
    this.rigidBody = false;
  }

  public override load(): void {
    this.createHitbox();
    super.load();
  }

  private createHitbox(): void {
    const hitbox = new HitboxEntity(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
    this.setHitboxEntities([hitbox]);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = LIGHT_GREEN_COLOR;
    context.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
    context.restore();
    super.render(context);
  }
}
