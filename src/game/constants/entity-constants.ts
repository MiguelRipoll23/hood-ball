/**
 * Constants related to entity behavior and configuration
 */

/**
 * Number of frames to skip interpolation after teleporting an entity
 * This prevents visual artifacts during position updates
 */
export const TELEPORT_SKIP_FRAMES = 3;

/**
 * Standard spawn angle for cars (π/2 radians = 90 degrees, facing up)
 */
export const SPAWN_ANGLE = Math.PI / 2;

/**
 * Fixed network ID for the game ball entity.
 * The ball is a singleton in each match; a deterministic ID ensures
 * all peers reference the same entity across the network.
 */
export const BALL_NETWORK_ID = "00000000000000000000000000000000";
