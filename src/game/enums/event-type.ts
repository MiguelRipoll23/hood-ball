/**
 * Game Event Types — Game-specific event type constants.
 *
 * Extends the engine's opaque EventType (number).
 * Register names at startup via registerEventTypeNames() for engine-level logging.
 *
 * Usage:
 *   import { GameEventType, registerEventTypeNames } from "../enums/event-type.js";
 *   // Use GameEventType.GoalScored for values
 *   registerEventTypeNames(); // call once at startup
 */

import { EventTypeNames } from "../../engine/enums/event-type.js";

export const GameEventType = {
  DebugChanged: 0,
  ServerAuthenticated: 1,
  ServerConnected: 2,
  ServerNotification: 3,
  ServerDisconnected: 4,
  MatchAdvertised: 5,
  PlayerConnected: 6,
  HostDisconnected: 7,
  PlayerDisconnected: 8,
  Countdown: 9,
  GoalScored: 10,
  GameOver: 11,
  BoostPadConsumed: 12,
  MatchmakingStarted: 13,
  OnlinePlayers: 14,
  CarDemolished: 15,
  ReturnToMainMenu: 16,
  SnowWeather: 17,
  PlayerBanned: 18,
  UserBannedByServer: 19,
  UserKickedByServer: 20,
} as const;

export type GameEventType = (typeof GameEventType)[keyof typeof GameEventType];

/** Register all game event type names for engine-level debugging/logging. */
export function registerEventTypeNames(): void {
  for (const [name, id] of Object.entries(GameEventType)) {
    EventTypeNames[id as number] = name;
  }
}
