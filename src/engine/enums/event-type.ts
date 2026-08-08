/**
 * EventType — Opaque type for event identifiers.
 *
 * The engine treats event types as opaque numbers. The game layer defines
 * the actual event type values and registers human-readable names via
 * EventTypeNames for debugging/logging purposes.
 *
 * Usage in game layer:
 *   export const GameEventType = {
 *     GoalScored: 0,
 *     PlayerConnected: 1,
 *     ...
 *   } as const;
 *   export type GameEventType = (typeof GameEventType)[keyof typeof GameEventType];
 *
 *   // Register names for engine logging:
 *   Object.entries(GameEventType).forEach(([name, id]) => {
 *     EventTypeNames[id] = name;
 *   });
 */

export type EventType = number;

/**
 * Registry of human-readable names for event types.
 * Populated by the game layer at startup for debugging/logging.
 */
export const EventTypeNames: Record<number, string> = {};
