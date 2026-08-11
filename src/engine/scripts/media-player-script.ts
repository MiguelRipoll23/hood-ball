import type { ScriptLifecycle } from "../components/script-component.js";
import { RecordingPlayerService, PlaybackState } from "../services/gameplay/recording-player-service.js";

export class MediaPlayerScript implements ScriptLifecycle {
  private playerService: RecordingPlayerService;

  constructor(playerService: RecordingPlayerService) { this.playerService = playerService; }

  update(dt: DOMHighResTimeStamp): void { this.playerService.update(dt); }

  render(context: CanvasRenderingContext2D): void {
    const state = this.playerService.getPlaybackState();
    if (state === PlaybackState.Stopped) return;
    context.save(); context.resetTransform();
    const cw = context.canvas.width, ch = context.canvas.height;
    const ctrlH = 60, ctrlY = ch - ctrlH, pad = 20;

    context.fillStyle = "rgba(0, 0, 0, 0.7)"; context.fillRect(0, ctrlY, cw, ctrlH);
    const barY = ctrlY + 15, barH = 8, barW = cw - pad * 2, barX = pad;
    context.fillStyle = "rgba(255, 255, 255, 0.3)"; context.fillRect(barX, barY, barW, barH);
    context.fillStyle = "#2196F3"; context.fillRect(barX, barY, barW * this.playerService.getProgress(), barH);
    context.fillStyle = "white"; context.font = "14px monospace"; context.textAlign = "left";
    context.fillText(
      `${this.fmt(this.playerService.getCurrentTimeMs())} / ${this.fmt(this.playerService.getTotalDurationMs())}`,
      barX, barY + barH + 20,
    );
    context.textAlign = "right";
    context.fillText(
      state === PlaybackState.Playing ? "\u25b6 Playing" : "\u23f8 Paused",
      cw - pad, barY + barH + 20,
    );
    context.restore();
  }

  getPlayerService(): RecordingPlayerService { return this.playerService; }
  isActive(): boolean { const s = this.playerService.getPlaybackState(); return s === PlaybackState.Playing || s === PlaybackState.Paused; }

  private fmt(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }
}
