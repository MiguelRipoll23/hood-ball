export const TunnelType = {
  SessionDescription: 0,
  IceCandidate: 1,
} as const;
export type TunnelType = (typeof TunnelType)[keyof typeof TunnelType];
