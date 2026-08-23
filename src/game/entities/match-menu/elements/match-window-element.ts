import { BaseGameEntity } from "../../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../../engine/components/script-component.js";
import { MatchWindowScript } from "../../../scripts/match-window-script.js";

export class MatchWindowElement extends BaseGameEntity {
  private readonly script: MatchWindowScript;

  constructor(x: number, y: number, width: number, height: number) {
    super();
    this.script = new MatchWindowScript(x, y, width, height);
    this.addComponent(new ScriptComponent(this.script));
  }

  public setLayout(x: number, y: number, width: number): void {
    this.script.mx = x; this.script.my = y; this.script.mw = width;
  }
}
