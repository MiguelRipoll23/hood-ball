export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userDisplayName: string;
  userPublicIp: string;
  userSymmetricKey: string;
  serverSignaturePublicKey: string;
  rtcIceServers: RTCIceServer[];
}
