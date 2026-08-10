import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";

export class ButtonEntity extends BaseGameEntity {
  private text: string = "Unknown";
  private pinchFactor = 2; // Control the pinch depth for the sides

  constructor(canvas: HTMLCanvasElement, text: string) {
    super();
    this.addComponent(new InputComponent());
    this.addComponent(new TransformComponent());
    this.addComponent(new ScriptComponent({ render: (ctx) => this.scriptRender(ctx) }));
    this.text = text;
    this.setSize(canvas);
  }

  public getX(): number {
    return this.getComponent(TransformComponent)!.x;
  }

  public getY(): number {
    return this.getComponent(TransformComponent)!.y;
  }

  public getWidth(): number {
    return this.getComponent(TransformComponent)!.width;
  }

  public getHeight(): number {
    return this.getComponent(TransformComponent)!.height;
  }

  public setPosition(x: number, y: number): void {
    this.getComponent(TransformComponent)!.x = x - this.getComponent(TransformComponent)!.width / 2;
    this.getComponent(TransformComponent)!.y = y - this.getComponent(TransformComponent)!.height / 2;
  }

  private setSize(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "bold 28px system-ui";
      this.getComponent(TransformComponent)!.width = ctx.measureText(this.text).width;
    } else {
      this.getComponent(TransformComponent)!.width = 0;
    }

    // Keep some padding around the text but avoid overly wide buttons
    this.getComponent(TransformComponent)!.width *= 2;
    this.getComponent(TransformComponent)!.height = 60;
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

    if (this.getComponent(InputComponent)!.pressed || this.getComponent(InputComponent)!.hovering) {
      context.fillStyle = "#7ed321";
    } else {
      context.fillStyle = "#4a90e2";
    }

    context.fill();

    context.fillStyle = "#FFFFFF";
    context.font = "bold 28px system-ui";
    context.textAlign = "center";
    context.fillText(
      this.text,
      this.getComponent(TransformComponent)!.x + this.getComponent(TransformComponent)!.width / 2, // Center horizontally
      this.getComponent(TransformComponent)!.y + this.getComponent(TransformComponent)!.height / 2 + 10 // Center vertically, with an adjustment for baseline
    );

    context.restore();
  }
}
