import { BaseGameEntity } from "./base-game-entity.js";
import {
  RecordingPlayerService,
  PlaybackState,
} from "../services/gameplay/recording-player-service.js";
import { container } from "../services/di-container.js";

/**
 * MediaPlayerEntity - Full-screen media player for recording playback
 *
 * This entity takes over the entire canvas to display recorded gameplay.
 * When active, it renders the recording with playback controls overlay.
 */
export class MediaPlayerEntity extends BaseGameEntity {
  private playerService: RecordingPlayerService;

  constructor(_canvas: HTMLCanvasElement) {
    super();
    this.playerService = container.get(RecordingPlayerService);
  }

  public override load(): void {
    console.log(`${this.constructor.name} loaded`);
    this.loaded = true;
  }

  public override update(deltaTime: number): void {
    // Update playback state
    this.playerService.update(deltaTime);
  }

  public override render(context: CanvasRenderingContext2D): void {
    // Render playback controls at the bottom of the screen
    const state = this.playerService.getPlaybackState();
    if (state === PlaybackState.Stopped) {
      return; // Don't render if not playing
    }

    // Save context state
    context.save();
    context.resetTransform();

    const canvas = context.canvas;
    const controlHeight = 60;
    const controlY = canvas.height - controlHeight;
    const padding = 20;

    // Semi-transparent background for controls
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, controlY, canvas.width, controlHeight);

    // Progress bar
    const barY = controlY + 15;
    const barHeight = 8;
    const barWidth = canvas.width - padding * 2;
    const barX = padding;

    // Background bar
    context.fillStyle = "rgba(255, 255, 255, 0.3)";
    context.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar (blue)
    const progress = this.playerService.getProgress();
    context.fillStyle = "#2196F3"; // Blue
    context.fillRect(barX, barY, barWidth * progress, barHeight);

    // Time display
    const currentTime = this.playerService.getCurrentTimeMs();
    const totalTime = this.playerService.getTotalDurationMs();
    const currentTimeStr = this.formatTime(currentTime);
    const totalTimeStr = this.formatTime(totalTime);

    context.fillStyle = "white";
    context.font = "14px monospace";
    context.textAlign = "left";
    context.fillText(
      `${currentTimeStr} / ${totalTimeStr}`,
      barX,
      barY + barHeight + 20
    );

    // Playback state indicator
    context.textAlign = "right";
    const stateText =
      state === PlaybackState.Playing ? "▶ Playing" : "⏸ Paused";
    context.fillText(stateText, canvas.width - padding, barY + barHeight + 20);

    context.restore();
  }

  private formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Check if the media player is currently active (playing or paused)
   */
  public isActive(): boolean {
    const state = this.playerService.getPlaybackState();
    return state === PlaybackState.Playing || state === PlaybackState.Paused;
  }

  /**
   * Get the underlying RecordingPlayerService for control operations
   */
  public getPlayerService(): RecordingPlayerService {
    return this.playerService;
  }
}
