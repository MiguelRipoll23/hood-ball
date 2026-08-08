import type { GameScene } from "../interfaces/scenes/game-scene-interface.js";
import { EngineLogger } from "./engine-logger.js";

/**
 * Scene Registry Service
 *
 * Maps SceneType numbers to factory functions for replay playback.
 * Mirrors the EntityRegistry pattern: game layer registers its replay
 * scene classes, and the recording player looks them up by sceneId.
 */
export class SceneRegistry {
  private static registry = new Map<number, () => GameScene>();

  /**
   * Register a replay scene factory for a given scene type.
   *
   * @param sceneType - SceneType enum value (e.g. GameSceneType.World)
   * @param factory - Factory function that creates a new replay scene instance
   */
  public static register(
    sceneType: number,
    factory: () => GameScene,
  ): void {
    if (this.registry.has(sceneType)) {
      EngineLogger.warn(
        "SceneRegistry",
        `Scene type "${sceneType}" is already registered, overwriting`,
      );
    }
    this.registry.set(sceneType, factory);
  }

  /**
   * Create a replay scene instance by its scene type ID.
   *
   * @param sceneType - SceneType enum value from the recording metadata
   * @returns A new scene instance, or null if the type is not registered
   */
  public static create(sceneType: number): GameScene | null {
    const factory = this.registry.get(sceneType);
    if (!factory) {
      EngineLogger.warn(
        "SceneRegistry",
        `Scene type "${sceneType}" is not registered in the scene registry`,
      );
      return null;
    }

    try {
      return factory();
    } catch (error) {
      EngineLogger.error(
        "SceneRegistry",
        `Failed to create replay scene for type "${sceneType}"`,
        error,
      );
      return null;
    }
  }

  /** Check if a scene type is registered. */
  public static has(sceneType: number): boolean {
    return this.registry.has(sceneType);
  }

  /** Clear all registered scene types (useful for testing). */
  public static clear(): void {
    this.registry.clear();
  }
}
