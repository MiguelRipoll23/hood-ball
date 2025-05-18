export const WebSocketType = {
  Notification: 0,
  Tunnel: 1,
} as const;
export type WebSocketType = (typeof WebSocketType)[keyof typeof WebSocketType];
