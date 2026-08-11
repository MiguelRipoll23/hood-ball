import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";
import { ButtonScript } from "../../scripts/button-script.js";

export class ButtonEntity extends BaseGameEntity {
  private readonly script: ButtonScript;

  constructor(canvas: HTMLCanvasElement, text: string) {
    super();
    const input = this.addComponent(new InputComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new ButtonScript(text);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, input);

    const ctx = canvas.getContext("2d")!;
    ctx.font = "bold 28px system-ui";
    transform.width = ctx.measureText(text).width * 2;
    transform.height = 60;
  }

  public getX(): number { return this.getComponent(TransformComponent)!.x; }
  public getY(): number { return this.getComponent(TransformComponent)!.y; }
  public getWidth(): number { return this.getComponent(TransformComponent)!.width; }
  public getHeight(): number { return this.getComponent(TransformComponent)!.height; }
  public isPressed(): boolean { return this.getComponent(InputComponent)!.pressed; }
  public isHovering(): boolean { return this.getComponent(InputComponent)!.hovering; }
  public handlePointerEvent(gp: import("../../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract): void {
    this.getComponent(InputComponent)!.handlePointerEvent(gp);
  }
  public setPosition(x: number, y: number): void {
    const t = this.getComponent(TransformComponent)!;
    t.x = x - t.width / 2; t.y = y - t.height / 2;
  }
}
