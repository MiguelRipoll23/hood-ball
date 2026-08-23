import { BaseGameEntity } from "../../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../../engine/components/script-component.js";
import { MatchTitleBarScript } from "../../../scripts/match-title-bar-script.js";

export class MatchTitleBarElement extends BaseGameEntity {
  private readonly script: MatchTitleBarScript;

  constructor(x: number, y: number, width: number, height: number, padding: number) {
    super();
    this.script = new MatchTitleBarScript(x, y, width, height, padding);
    this.addComponent(new ScriptComponent(this.script));
  }

  public setLayout(x: number, y: number, width: number): void {
    this.script.mx = x; this.script.my = y; this.script.mw = width;
  }
}
