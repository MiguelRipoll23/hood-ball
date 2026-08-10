import { BaseGameEntity } from "../../engine/entities/base-game-entity.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { BoostMeterScript } from "../scripts/boost-meter-script.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";
import { EngineLogger } from "../../engine/services/engine-logger.js";
import { TransformComponent } from "../../engine/components/transform-component.js";

const RADIUS = 32;

export class BoostMeterEntity extends BaseGameEntity {
  private readonly script: BoostMeterScript;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.addComponent(new TransformComponent());
    this.script = new BoostMeterScript();
    this.addComponent(new ScriptComponent(this.script));

    this.getComponent(TransformComponent)!.width = RADIUS * 2;
    this.getComponent(TransformComponent)!.height = RADIUS * 2;
    this.setPosition(canvas.width / 2, canvas.height - RADIUS - 30);
  }

  public setBoostLevel(level: number): void {
    this.script.boostLevel = Math.max(0, Math.min(1, level));
  }
  public setAttemptingBoostWhileEmpty(active: boolean): void {
    this.script.boostAttemptWhileEmpty = active;
  }
  public getBoostLevel(): number { return this.script.boostLevel; }
  public getX(): number { return this.getComponent(TransformComponent)!.x; }
  public getY(): number { return this.getComponent(TransformComponent)!.y; }
  public getWidth(): number { return this.getComponent(TransformComponent)!.width; }
  public getHeight(): number { return this.getComponent(TransformComponent)!.height; }

  public setPosition(x: number, y: number): void {
    this.getComponent(TransformComponent)!.x = x - this.getComponent(TransformComponent)!.width / 2;
    this.getComponent(TransformComponent)!.y = y - this.getComponent(TransformComponent)!.height / 2;
    this.script.x = this.getComponent(TransformComponent)!.x;
    this.script.y = this.getComponent(TransformComponent)!.y;
  }

  public override getReplayState(): ArrayBuffer | null {
    return BinaryWriter.build()
      .float32(this.script.boostLevel)
      .boolean(this.script.boostAttemptWhileEmpty)
      .toArrayBuffer();
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    if (!arrayBuffer || arrayBuffer.byteLength < 5) {
      EngineLogger.warn("BoostMeterEntity",
        `applyReplayState received invalid buffer size: ${arrayBuffer ? arrayBuffer.byteLength : 0}`,
      );
      return;
    }
    try {
      const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
      this.script.boostLevel = reader.float32();
      this.script.boostAttemptWhileEmpty = reader.boolean();
      this.script.displayLevel = this.script.boostLevel;
    } catch (error) {
      EngineLogger.error("BoostMeterEntity",
        "Error applying replay state, buffer length:", arrayBuffer.byteLength, error,
      );
    }
  }

  public override render(context: CanvasRenderingContext2D): void {
    this.script.x = this.getComponent(TransformComponent)!.x;
    this.script.y = this.getComponent(TransformComponent)!.y;
    this.script.globalAlpha = this.getOpacity();
    super.render(context);
  }
}
