import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { GoalExplosionScript } from "../scripts/goal-explosion-script.js";
import {
  BLUE_TEAM_COLOR,
  RED_TEAM_COLOR,
} from "../constants/colors-constants.js";
import { TeamType } from "../enums/team-type.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";

export class GoalExplosionEntity extends BaseGameEntity {
  private readonly script: GoalExplosionScript;

  constructor(canvas: HTMLCanvasElement, x: number, y: number, team: TeamType) {
    super();
    this.script = new GoalExplosionScript(canvas, x, y, team);
    this.addComponent(new ScriptComponent(this.script));
  }

  public override update(_delta: DOMHighResTimeStamp): void {
    super.update(_delta);
    if (this.script.isFinished()) this.setRemoved(true);
  }

  public override getReplayState(): ArrayBuffer | null {
    return BinaryWriter.build()
      .unsignedInt16(this.script.x)
      .unsignedInt16(this.script.y)
      .unsignedInt8(this.script.team)
      .unsignedInt16(this.script.elapsed)
      .toArrayBuffer();
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
    this.script.x = reader.unsignedInt16();
    this.script.y = reader.unsignedInt16();
    this.script.team = reader.unsignedInt8();
    this.script.elapsed = reader.unsignedInt16();
    this.script.color =
      this.script.team === TeamType.Blue ? BLUE_TEAM_COLOR : RED_TEAM_COLOR;
    const t = Math.min(this.script.elapsed / 2000, 1);
    // Recalc visual state from elapsed
    this.script.shockwaveRadius = 120 * t;
    this.script.distortionRadius = 80 * t;
    this.script.flashOpacity = 1 - Math.min(this.script.elapsed / 200, 1);
    this.script.distortionOpacity = 1 - t;
  }
}
