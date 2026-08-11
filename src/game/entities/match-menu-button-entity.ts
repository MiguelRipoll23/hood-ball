import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { BoostMeterEntity } from "./boost-meter-entity.js";
import { HelpEntity } from "./help-entity.js";
import { TransformComponent } from "../../engine/components/transform-component.js";
import { InputComponent } from "../../engine/components/input-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { MatchMenuButtonScript } from "../scripts/match-menu-button-script.js";

/**
 * Pure component container for the burger-menu button. All input
 * detection and rendering lives in {@link MatchMenuButtonScript}.
 */
export class MatchMenuButtonEntity extends BaseGameEntity {
  private readonly script: MatchMenuButtonScript;

  constructor(
    boostMeterEntity: BoostMeterEntity,
    helpEntity: HelpEntity,
  ) {
    super();
    const input = this.addComponent(new InputComponent());
    const transform = this.addComponent(new TransformComponent());

    this.script = new MatchMenuButtonScript(boostMeterEntity, helpEntity);
    this.addComponent(new ScriptComponent(this.script));
    this.script.resolveComponents(transform, input);
    this.script.init();
  }

  public setOnToggleMenu(cb: () => void): void { this.script.setOnToggleMenu(cb); }
  public setMenuVisible(v: boolean): void { this.script.menuVisible = v; }
  public setActive(v: boolean): void { this.getComponent(InputComponent)!.active = v; }
}
