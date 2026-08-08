/**
 * SceneType — Opaque type for scene identifiers.
 *
 * The engine treats scene types as opaque numbers. Use SceneTypeUnknown
 * as the default/fallback value. The game layer should define its own
 * scene type enum starting from 1.
 */

export type SceneType = number;

/** Sentinel value for unknown/unset scene type. */
export const SceneTypeUnknown: SceneType = 0;
