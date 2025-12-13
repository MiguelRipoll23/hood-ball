import { BaseGameScene } from "./base-game-scene.js";
import { GameState } from "../models/game-state.js";
import { SceneType } from "../enums/scene-type.js";
import { EventConsumerService } from "../services/gameplay/event-consumer-service.js";
import { container } from "../services/di-container.js";

/**
 * RecordingReplayScene - A minimal scene for playing back recordings
 * 
 * This scene is automatically loaded during replay playback.
 * It doesn't have gameplay logic - entities are driven by recorded data.
 * 
 * Key features:
 * - Minimal scene setup (no gameplay systems)
 * - Input disabled
 * - Physics disabled (entities driven by recording)
 * - AI disabled
 */
export class RecordingReplayScene extends BaseGameScene {
  private replayActive = true;

  constructor(gameState: GameState) {
    const eventConsumerService = container.get(EventConsumerService);
    super(gameState, eventConsumerService);
  }

  public getTypeId(): SceneType {
    return SceneType.World; // Replay uses world scene type
  }

  public load(): void {
    console.log("RecordingReplayScene loaded - gameplay systems disabled");
    this.loaded = true;
    // Don't create any entities - RecordingPlayerService will spawn them
  }

  public update(deltaTime: number): void {
    // Only update entities, no gameplay logic
    for (const entity of this.worldEntities) {
      if (!entity.isRemoved()) {
        entity.update(deltaTime);
      }
    }

    for (const entity of this.uiEntities) {
      if (!entity.isRemoved()) {
        entity.update(deltaTime);
      }
    }

    // Remove entities marked for removal
    this.worldEntities = this.worldEntities.filter(e => !e.isRemoved());
    this.uiEntities = this.uiEntities.filter(e => !e.isRemoved());
  }

  public handleKeyDown(_event: KeyboardEvent): void {
    // Input disabled during replay
  }

  public handleKeyUp(_event: KeyboardEvent): void {
    // Input disabled during replay
  }

  public isReplayActive(): boolean {
    return this.replayActive;
  }

  public setReplayActive(active: boolean): void {
    this.replayActive = active;
  }
}
