import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { JoystickScript } from "../scripts/joystick-script.js";

/**
 * Pure component container for the on-screen joystick. All touch input
 * handling, angle/magnitude calculation, and rendering live in
 * {@link JoystickScript}.
 */
export class JoystickEntity extends BaseGameEntity {
  private readonly script: JoystickScript;

  constructor(gamePointer: GamePointerContract) {
    super();
    const input = this.addComponent(new InputComponent());
    this.script = new JoystickScript(gamePointer);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveInput(input);
  }

  public isActive(): boolean { return this.script.isActive(); }
  public getAngle(): number { return this.script.getAngle(); }
  public getMagnitude(): number { return this.script.getMagnitude(); }
}
