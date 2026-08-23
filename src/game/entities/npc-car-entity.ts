import { CarEntity } from "./car-entity.js";
import { BallEntity } from "./ball-entity.js";
import { GamePlayer } from "../models/game-player.js";
import { NetworkComponent } from "../../engine/components/network-component.js";
import { ScriptComponent } from "../../engine/components/script-component.js";
import { NpcScript } from "../scripts/npc-script.js";
import { EntityUtils, type MoveableEntity } from "../../engine/utils/entity-utils.js";
import { BinaryWriter } from "../../engine/utils/binary-writer-utils.js";
import { BinaryReader } from "../../engine/utils/binary-reader-utils.js";

/**
 * Thin container. NPC AI logic lives in {@link NpcScript}, attached
 * at priority -1 so it runs before CarScript each frame.
 */
export class NpcCarEntity extends CarEntity {
  private readonly npcScript: NpcScript;

  constructor(
    x: number, y: number, angle: number,
    canvas: HTMLCanvasElement,
    ballEntity?: BallEntity,
    spawnPointIndex: number = -1,
  ) {
    super(x, y, angle, true);
    this.setCanvas(canvas);

    this.carScript.setTopSpeed(0.5);
    this.carScript.setAcceleration(0.004);

    const npcPlayer = new GamePlayer(
      "npc-00000000-0000-0000-0000-000000000000",
      "🤖 NPC", false, 0, spawnPointIndex, true,
    );
    const net = this.getComponent(NetworkComponent)!;
    net.owner = npcPlayer;

    this.npcScript = new NpcScript(ballEntity);
    this.npcScript.resolveEntity(this);
    this.addComponent(new ScriptComponent(this.npcScript, -1));

    // Bounds safety check, matching the pre-refactor NpcCarEntity.update()
    // behavior (which only ran while the NPC was active). Runs after
    // CarScript (priority 0) so it corrects the position produced by this
    // frame's movement.
    this.addComponent(
      new ScriptComponent(
        {
          update: () => {
            if (!this.npcScript.inputActive) return;
            const canvas = this.getCanvas();
            if (canvas) {
              EntityUtils.fixEntityPositionIfOutOfBounds(
                this as unknown as MoveableEntity,
                canvas,
              );
            }
          },
        },
        1,
      ),
    );
  }

  public setActive(active: boolean): void { this.npcScript.inputActive = active; }
  public isActive(): boolean { return this.npcScript.inputActive; }

  public setBoostPads(pads: Array<{ x: number; y: number; consumed: boolean }>): void {
    this.npcScript.setBoostPads(pads);
  }

  public override reset(): void {
    super.reset();
    this.npcScript.reset();
  }

  public override getReplayState(): ArrayBuffer | null {
    const parentState = super.getReplayState();
    if (!parentState) return null;
    const writer = BinaryWriter.build();
    writer.arrayBuffer(parentState);
    writer.boolean(this.npcScript.inputActive);
    return writer.toArrayBuffer();
  }

  public override applyReplayState(arrayBuffer: ArrayBuffer): void {
    const reader = BinaryReader.fromArrayBuffer(arrayBuffer);
    const parentStateLength = arrayBuffer.byteLength - 1;
    super.applyReplayState(arrayBuffer.slice(0, parentStateLength));
    reader.seek(parentStateLength);
    this.npcScript.inputActive = reader.boolean();
  }
}
