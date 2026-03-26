export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userDisplayName: string;
  userRoles?: string[];
  userPublicIp: string;
  userSymmetricKey: string;
  serverSignaturePublicKey: string;
  rtcIceServers: RTCIceServer[];
}
