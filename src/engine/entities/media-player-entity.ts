import { BaseGameEntity } from "./base-game-entity.js";
import { ScriptComponent } from "../components/script-component.js";
import { EngineLogger } from "../services/engine-logger.js";
import { RecordingPlayerService } from "../services/gameplay/recording-player-service.js";
import { MediaPlayerScript } from "../scripts/media-player-script.js";

export class MediaPlayerEntity extends BaseGameEntity {
  private readonly script: MediaPlayerScript;

  constructor(_canvas: HTMLCanvasElement, playerService: RecordingPlayerService) {
    super();
    this.script = new MediaPlayerScript(playerService);
    this.addComponent(new ScriptComponent(this.script));
  }

  public override load(): void { EngineLogger.info("MediaPlayer", `${this.constructor.name} loaded`); this.loaded = true; }
  public isActive(): boolean { return this.script.isActive(); }
  public getPlayerService(): RecordingPlayerService { return this.script.getPlayerService(); }
}
