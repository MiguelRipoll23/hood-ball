import { BaseGameEntity } from "../../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../../engine/components/script-component.js";
import { ProgressBarScript } from "../../scripts/progress-bar-script.js";

export class ProgressBarEntity extends BaseGameEntity {
  private readonly script: ProgressBarScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.script = new ProgressBarScript(canvas);
    this.addComponent(new ScriptComponent(this.script));
  }

  public update(): void { this.script.update(); }
  public setText(text: string): void { this.script.text = text; }
  public setProgress(progress: number): void { this.script.currentProgress = progress; }
}
