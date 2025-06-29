export interface AuthenticationResponse {
  authenticationToken: string;
  sessionKey: string;
  userId: string;
  displayName: string;
  publicIp: string;
  rtcIceServers: RTCIceServer[];
}
