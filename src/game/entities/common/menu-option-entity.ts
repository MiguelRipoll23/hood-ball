import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";

export class MenuOptionEntity extends BaseGameEntity {
  private index: number = 0;
  private content: string = "Unknown";
  private requiresOnlineConnection: boolean = false;

  private textX = 0;
  private textY = 0;
  private pinchFactor = 12; // Control the pinch depth for the sides

  constructor(canvas: HTMLCanvasElement, index: number, content: string) {
    super();
    this.addComponent(new InputComponent());
    this.addComponent(new TransformComponent());
    this.addComponent(new ScriptComponent({ render: (ctx) => this.scriptRender(ctx) }));
    this.index = index;
    this.content = content;
    this.setSize(canvas);
  }

  public getIndex(): number {
    return this.index;
  }

  public getHeight(): number {
    return this.getComponent(TransformComponent)!.height;
  }

  public getRequiresOnlineConnection(): boolean {
    return this.requiresOnlineConnection;
  }

    public setActive(v: boolean): void { this.getComponent(InputComponent)!.active = v; }

  public setRequiresOnlineConnection(requiresOnlineConnection: boolean): void {
    this.requiresOnlineConnection = requiresOnlineConnection;
  }

  public setPosition(x: number, y: number): void {
    this.getComponent(TransformComponent)!.x = x;
    this.getComponent(TransformComponent)!.y = y;
    this.getComponent(TransformComponent)!.angle = this.index === 0 ? -0.05 : this.index === 1 ? 0.05 : -0.02;

    this.calculateTextPosition();
  }

  private scriptRender(context: CanvasRenderingContext2D): void {
    context.save();

    context.translate(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2);
    context.rotate(this.getComponent(TransformComponent)!.angle);
    context.translate(-(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2), -(this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2));

    context.beginPath();

    // Top side with single pinch in the center
    context.moveTo(this.getComponent(TransformComponent)!.x + this.pinchFactor, this.getComponent(TransformComponent)!.y);
    context.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2,
      this.getComponent(TransformComponent)!.y - this.pinchFactor, // Pinch inward at the center
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width - this.pinchFactor,
      this.getComponent(TransformComponent)!.y
    );

    // Top right corner transitioning from top side to right side
    context.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.pinchFactor
    );

    // Right side with single pinch in the center
    context.lineTo(this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width, this.getComponent(TransformComponent)!.y + this.pinchFactor);
    context.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width + this.pinchFactor / 2, // Pinch inward at the center
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height - this.pinchFactor
    );

    // Bottom right corner transitioning from right side to bottom side
    context.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width - this.pinchFactor,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height
    );

    // Bottom side with single pinch in the center
    context.lineTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width - this.pinchFactor,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height
    );
    context.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height + this.pinchFactor, // Pinch inward at the center
      this.getComponent(TransformComponent)!.x + this.pinchFactor,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height
    );

    // Bottom left corner transitioning from bottom side to left side
    context.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height,
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height - this.pinchFactor
    );

    // Left side with single pinch in the center
    context.lineTo(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height - this.pinchFactor);
    context.quadraticCurveTo(
      this.getComponent(TransformComponent)!.x - this.pinchFactor / 2, // Pinch inward at the center
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2,
      this.getComponent(TransformComponent)!.x,
      this.getComponent(TransformComponent)!.y + this.pinchFactor
    );

    // Top left corner transitioning from left side to top side
    context.quadraticCurveTo(this.getComponent(TransformComponent)!.x, this.getComponent(TransformComponent)!.y, this.getComponent(TransformComponent)!.x + this.pinchFactor, this.getComponent(TransformComponent)!.y);

    context.closePath();

    if (!this.getComponent(InputComponent)!.active) {
      context.fillStyle = "#ccc"; // Gray color for inactive state
    } else if (this.getComponent(InputComponent)!.pressed || this.getComponent(InputComponent)!.hovering) {
      context.fillStyle = "#7ed321";
    } else {
      context.fillStyle = "#4a90e2";
    }

    context.fill();

    context.fillStyle = "#FFFFFF";
    context.font = "bold 28px system-ui";
    context.textAlign = "center";
    context.fillText(this.content, this.textX, this.textY);

    context.restore();
    super.render(context);
  }

  private setSize(canvas: HTMLCanvasElement): void {
    this.getComponent(TransformComponent)!.width = canvas.width - 60;
    this.getComponent(TransformComponent)!.height = 120;
  }

  private calculateTextPosition(): void {
    this.textX = this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2 + 8;
    this.textY = this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2 + 8;
  }
  public override render(context: CanvasRenderingContext2D): void { super.render(context); }
}
