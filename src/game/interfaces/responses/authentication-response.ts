export interface AuthenticationResponse {
  authenticationToken: string;
  userId: string;
  userDisplayName: string;
  userPublicIp: string;
  userSymmetricKey: string;
  serverSignaturePublicKey: string;
  rtcIceServers: RTCIceServer[];
}
