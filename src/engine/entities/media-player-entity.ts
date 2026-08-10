import { BaseGameEntity } from "./base-game-entity.js";
import { ScriptComponent } from "../components/script-component.js";
import { EngineLogger } from "../services/engine-logger.js";
import { RecordingPlayerService, PlaybackState } from "../services/gameplay/recording-player-service.js";

export class MediaPlayerEntity extends BaseGameEntity {
  private readonly playerService: RecordingPlayerService;

  constructor(_canvas: HTMLCanvasElement, playerService: RecordingPlayerService) {
    super();
    this.playerService = playerService;
    const ps = playerService;
    this.addComponent(new ScriptComponent({
      update: (dt) => { ps.update(dt); },
      render: (ctx) => {
        const state = ps.getPlaybackState();
        if (state === PlaybackState.Stopped) return;
        ctx.save(); ctx.resetTransform();
        const cw = ctx.canvas.width, ch = ctx.canvas.height, ctrlH = 60, ctrlY = ch - ctrlH, pad = 20;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; ctx.fillRect(0, ctrlY, cw, ctrlH);
        const barY = ctrlY + 15, barH = 8, barW = cw - pad * 2, barX = pad;
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = "#2196F3"; ctx.fillRect(barX, barY, barW * ps.getProgress(), barH);
        ctx.fillStyle = "white"; ctx.font = "14px monospace"; ctx.textAlign = "left";
        ctx.fillText(`${this.fmt(ps.getCurrentTimeMs())} / ${this.fmt(ps.getTotalDurationMs())}`, barX, barY + barH + 20);
        ctx.textAlign = "right";
        ctx.fillText(state === PlaybackState.Playing ? "\u25b6 Playing" : "\u23f8 Paused", cw - pad, barY + barH + 20);
        ctx.restore();
      },
    }));
  }

  public override load(): void { EngineLogger.info("MediaPlayer", `${this.constructor.name} loaded`); this.loaded = true; }
  private fmt(ms: number): string { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`; }
  public isActive(): boolean { const s = this.playerService.getPlaybackState(); return s === PlaybackState.Playing || s === PlaybackState.Paused; }
  public getPlayerService(): RecordingPlayerService { return this.playerService; }
}
