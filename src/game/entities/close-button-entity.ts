import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { InputComponent } from "../../engine/components/input-component.js";

export class CloseButtonEntity extends BaseGameEntity {
  private readonly BUTTON_SIZE = 40;
  private readonly TEXT_COLOR = "#ffffff";
  private readonly HOVER_COLOR = "#7ed321";

  constructor(x: number, y: number) {
    super();
    this.addComponent(new InputComponent());
    this.addComponent(new TransformComponent());
    const _s = this; this.addComponent(new ScriptComponent({ update: (dt) => _s.scriptUpdate(dt), render: (ctx) => _s.scriptRender(ctx) }));
    this.getComponent(TransformComponent)!.x = x;
    this.getComponent(TransformComponent)!.y = y;
    this.getComponent(TransformComponent)!.width = this.BUTTON_SIZE;
    this.getComponent(TransformComponent)!.height = this.BUTTON_SIZE;
  }

    public isPressed(): boolean { return this.getComponent(InputComponent)!.pressed; }
  public isHovering(): boolean { return this.getComponent(InputComponent)!.hovering; }

  public setPosition(x: number, y: number): void {
    this.getComponent(TransformComponent)!.x = x;
    this.getComponent(TransformComponent)!.y = y;
  }

  private scriptUpdate(_delta: DOMHighResTimeStamp): void {
    // super.update removed — BaseGameEntity.update already runs scripts
  }

  private scriptRender(context: CanvasRenderingContext2D): void {
    context.save();

    context.font = "28px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = this.getComponent(InputComponent)!.hovering ? this.HOVER_COLOR : this.TEXT_COLOR;
    context.fillText(
      "✕",
      this.getComponent(TransformComponent)!.x + this.BUTTON_SIZE / 2,
      this.getComponent(TransformComponent)!.y + this.BUTTON_SIZE / 2
    );

    context.restore();
  }
}
