import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { AnimationComponent } from "../../engine/components/animation-component.js";
import { SettingScript } from "../scripts/setting-script.js";

/**
 * Pure component container for a settings toggle row. All input handling,
 * rendering, and toggle logic lives in {@link SettingScript}.
 */
export class SettingEntity extends BaseGameEntity {
  private readonly script: SettingScript;

  constructor(
    private settingId: string,
    settingText: string,
    settingState = false,
  ) {
    super();
    this.addComponent(new AnimationComponent());
    const input = this.addComponent(new InputComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new SettingScript(settingText, settingState);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, input);
    this.script.init();
  }

  public setIndented(indented: boolean): void {
    this.script.indented = indented;
  }

  public getSettingId(): string { return this.settingId; }
  public getSettingState(): boolean { return this.script.getSettingState(); }
  public getUpdated(): boolean { return this.script.updated; }
  public setUpdated(updated: boolean): void { this.script.updated = updated; }
  public setX(x: number): void { this.getComponent(TransformComponent)!.x = x; }
  public setY(y: number): void { this.getComponent(TransformComponent)!.y = y; }
}
