import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { TransformComponent } from "../../../engine/components/transform-component.js";
import { InputComponent } from "../../../engine/components/input-component.js";
import { MenuOptionScript } from "../../scripts/menu-option-script.js";

export class MenuOptionEntity extends BaseGameEntity {
  private readonly script: MenuOptionScript;
  private readonly index: number;

  constructor(canvas: HTMLCanvasElement, index: number, content: string) {
    super();
    this.index = index;
    const input = this.addComponent(new InputComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new MenuOptionScript(content);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, input);

    transform.width = canvas.width - 60;
    transform.height = 120;
  }

  public getIndex(): number { return this.index; }
  public getHeight(): number { return this.getComponent(TransformComponent)!.height; }
  public getRequiresOnlineConnection(): boolean { return false; }
  public setActive(v: boolean): void { this.getComponent(InputComponent)!.active = v; }
  public isActive(): boolean { return this.getComponent(InputComponent)!.active; }
  public isPressed(): boolean { return this.getComponent(InputComponent)!.pressed; }
  public isHovering(): boolean { return this.getComponent(InputComponent)!.hovering; }
  public handlePointerEvent(gp: import("../../../engine/interfaces/input/game-pointer-interface.js").GamePointerContract): void {
    this.getComponent(InputComponent)!.handlePointerEvent(gp);
  }
  public setRequiresOnlineConnection(_v: boolean): void { /* no-op */ }
  public setPosition(x: number, y: number): void {
    const angle = this.index === 0 ? -0.05 : this.index === 1 ? 0.05 : -0.02;
    this.script.setPosition(x, y, angle);
  }
}
