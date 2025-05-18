export const EventType = {
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
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];
