export const ConnectionStateType = {
  Disconnected: 0,
  Connected: 1,
} as const;
export type ConnectionStateType =
  (typeof ConnectionStateType)[keyof typeof ConnectionStateType];
