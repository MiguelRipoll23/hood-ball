import type { GamePointerContract } from "../../engine/interfaces/input/game-pointer-interface.js";
import { EntityRegistryType } from "../enums/entity-registry-type.js";
import { CarEntity } from "./car-entity.js";
import { JoystickEntity } from "./joystick-entity.js";
import type { GameKeyboardContract } from "../../engine/interfaces/input/game-keyboard-interface.js";
import type { GameGamepadContract } from "../../engine/interfaces/input/game-gamepad-interface.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { ChatButtonEntity } from "./chat-button-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { LocalInputScript } from "../scripts/local-input-script.js";

/**
 * Thin container. Input handling lives in {@link LocalInputScript}, attached
 * at priority -1 so it runs before CarScript each frame.
 */
export class LocalCarEntity extends CarEntity {
  private readonly inputScript: LocalInputScript;

  constructor(
    x: number, y: number, angle: number,
    protected readonly canvas: HTMLCanvasElement,
    gamePointer?: GamePointerContract,
    gameKeyboard?: GameKeyboardContract,
    gameGamepad?: GameGamepadContract,
  ) {
    super(x, y, angle);
    this.setCanvas(canvas);

    this.setSyncable(true);
    this.setId(crypto.randomUUID().replaceAll("-", ""));
    this.setTypeId(EntityRegistryType.RemoteCar);

    this.inputScript = new LocalInputScript(gamePointer, gameKeyboard, gameGamepad);
    this.inputScript.resolveEntity(this);
    this.addComponent(new ScriptComponent(this.inputScript, -1));
  }

  public override mustSync(): boolean {
    return super.mustSync() || this.carScript.speed !== 0;
  }

  public override reset(): void {
    super.reset();
    this.inputScript.reset();
  }

  public setActive(active: boolean): void { this.inputScript.inputActive = active; }
  public isActive(): boolean { return this.inputScript.inputActive; }
  public getJoystickEntity(): JoystickEntity | null { return this.inputScript.getJoystickEntity(); }
  public setBoostMeterEntity(meter: BoostMeterEntity): void { this.inputScript.setBoostMeterEntity(meter); }
  public getBoostMeterEntity(): BoostMeterEntity | null { return this.inputScript.getBoostMeterEntity(); }
  public setChatButtonEntity(chatButton: ChatButtonEntity): void { this.inputScript.setChatButtonEntity(chatButton); }
}
