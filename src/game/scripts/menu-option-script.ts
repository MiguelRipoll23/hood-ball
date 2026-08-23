import type { ScriptLifecycle } from "../../engine/components/script-component.js";
import type { TransformComponent } from "../../engine/components/transform-component.js";
import type { InputComponent } from "../../engine/components/input-component.js";

export class MenuOptionScript implements ScriptLifecycle {
  private content: string;
  private pinchFactor = 12;
  private transform!: TransformComponent;
  private input!: InputComponent;
  private textX = 0;
  private textY = 0;

  constructor(content: string) { this.content = content; }

  resolveComponents(transform: TransformComponent, input: InputComponent): void {
    this.transform = transform;
    this.input = input;
  }

  setPosition(x: number, y: number, angle: number): void {
    this.transform.x = x;
    this.transform.y = y;
    this.transform.angle = angle;
    this.textX = x + this.transform.width / 2 + 8;
    this.textY = y + this.transform.height / 2 + 8;
  }

  render(context: CanvasRenderingContext2D): void {
    const t = this.transform;
    context.save();
    context.translate(t.x + t.width / 2, t.y + t.height / 2);
    context.rotate(t.angle);
    context.translate(-(t.x + t.width / 2), -(t.y + t.height / 2));

    context.beginPath();
    context.moveTo(t.x + this.pinchFactor, t.y);
    context.quadraticCurveTo(t.x + t.width / 2, t.y - this.pinchFactor, t.x + t.width - this.pinchFactor, t.y);
    context.quadraticCurveTo(t.x + t.width, t.y, t.x + t.width, t.y + this.pinchFactor);
    context.lineTo(t.x + t.width, t.y + this.pinchFactor);
    context.quadraticCurveTo(t.x + t.width + this.pinchFactor / 2, t.y + t.height / 2, t.x + t.width, t.y + t.height - this.pinchFactor);
    context.quadraticCurveTo(t.x + t.width, t.y + t.height, t.x + t.width - this.pinchFactor, t.y + t.height);
    context.lineTo(t.x + t.width - this.pinchFactor, t.y + t.height);
    context.quadraticCurveTo(t.x + t.width / 2, t.y + t.height + this.pinchFactor, t.x + this.pinchFactor, t.y + t.height);
    context.quadraticCurveTo(t.x, t.y + t.height, t.x, t.y + t.height - this.pinchFactor);
    context.lineTo(t.x, t.y + t.height - this.pinchFactor);
    context.quadraticCurveTo(t.x - this.pinchFactor / 2, t.y + t.height / 2, t.x, t.y + this.pinchFactor);
    context.quadraticCurveTo(t.x, t.y, t.x + this.pinchFactor, t.y);
    context.closePath();

    if (!this.input.active) context.fillStyle = "#ccc";
    else if (this.input.pressed || this.input.hovering) context.fillStyle = "#7ed321";
    else context.fillStyle = "#4a90e2";
    context.fill();

    context.fillStyle = "#FFFFFF";
    context.font = "bold 28px system-ui";
    context.textAlign = "center";
    context.fillText(this.content, this.textX, this.textY);
    context.restore();
  }
}
