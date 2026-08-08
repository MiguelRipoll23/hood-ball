/**
 * Game Scene Types — Game-specific scene type constants.
 *
 * Extends the engine's opaque SceneType (number).
 * Game scenes return these values from getTypeId().
 */

export const GameSceneType = {
  /** Sentinel - matches engine's SceneTypeUnknown */
  Unknown: 0,
  World: 1,
  Error: 2,
} as const;

export type GameSceneType = (typeof GameSceneType)[keyof typeof GameSceneType];
