import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import type { GamePointerContract } from "../../../engine/interfaces/input/game-pointer-interface.js";
import { InputComponent } from "../../../engine/components/input-component.js";
import { ConfirmationMessageScript } from "../../scripts/confirmation-message-script.js";

export class ConfirmationMessageEntity extends BaseGameEntity {
  private readonly script: ConfirmationMessageScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    const input = this.addComponent(new InputComponent());
    this.script = new ConfirmationMessageScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveInput(input);
  }

  public isOpen(): boolean { return this.script.isOpened; }
  public isConfirmed(): boolean { return this.script.isConfirmed(); }
  public isCancelled(): boolean { return this.script.isCancelled(); }
  public show(question: string): void { this.script.show(question); }
  public close(): void { this.script.close(); }
  public handlePointerEvent(gp: GamePointerContract): void { this.script.handlePointerEvent(gp); }
}
