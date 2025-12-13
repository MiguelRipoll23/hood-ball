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

  public override render(_context: CanvasRenderingContext2D): void {
    // Note: Background rendering is handled by the scene itself
    // This entity only manages playback state, actual entity rendering
    // happens through the normal entity system
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
