export const MatchStateType = {
  Unknown: 0,
  WaitingPlayers: 1,
  Countdown: 2,
  InProgress: 3,
  GoalScored: 4,
  GameOver: 5,
} as const;

export type MatchStateType =
  (typeof MatchStateType)[keyof typeof MatchStateType];
