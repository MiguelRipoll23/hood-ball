import { BaseGameEntity } from "./base-game-entity.js";
import {
  MediaPlayerService,
  PlaybackState,
} from "../services/gameplay/player-service.js";
import { container } from "../services/di-container.js";

/**
 * MediaPlayerEntity - Full-screen media player for recording playback
 *
 * This entity takes over the entire canvas to display recorded gameplay.
 * When active, it renders the recording with playback controls overlay.
 */
export class MediaPlayerEntity extends BaseGameEntity {
  private playerService: MediaPlayerService;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    this.playerService = container.get(MediaPlayerService);
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
    // Save current state and reset transform to render at full canvas size
    context.save();
    context.resetTransform();

    // Fill the canvas with a solid black background
    context.fillStyle = "#000000";
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render the recording
    this.playerService.render(context);

    context.restore();
  }

  /**
   * Check if the media player is currently active (playing or paused)
   */
  public isActive(): boolean {
    const state = this.playerService.getPlaybackState();
    return state === PlaybackState.Playing || state === PlaybackState.Paused;
  }

  /**
   * Get the underlying MediaPlayerService for control operations
   */
  public getPlayerService(): MediaPlayerService {
    return this.playerService;
  }
}
