export const WebRTCType = {
  JoinRequest: 0,
  JoinResponse: 1,
  PlayerConnection: 2,
  SnapshotEnd: 3,
  SnapshotACK: 4,
  ObjectData: 5,
  EventData: 6,
  GracefulDisconnect: 7,
  PingRequest: 8,
  PingResponse: 9,
  PlayerPing: 10,
} as const;
export type WebRTCType = (typeof WebRTCType)[keyof typeof WebRTCType];
