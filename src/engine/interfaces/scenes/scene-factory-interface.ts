import type { GameScene } from "./game-scene-interface.js";

/**
 * SceneFactory — Allows the engine to create game scenes without
 * importing game code directly. The game layer implements this
 * interface and registers it with services that need scene creation
 * (e.g., RecordingPlayerService for playback).
 *
 * Follows the same pattern as RecorderService.setEntityTypeMapper().
 */
export interface SceneFactory {
  /**
   * Create a scene by its numeric type ID.
   * Returns null if the scene type is not supported.
   */
  createScene(sceneId: number): GameScene | null;
}
