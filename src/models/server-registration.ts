import type { AuthenticationResponse } from "../interfaces/response/authentication-response.js";

export class ServerRegistration {
  private authenticationToken: string;
  private sessionKey: string;
  private userId: string;
  private publicIp: string;
  private rtcIceServers: RTCIceServer[];

  constructor(registrationResponse: AuthenticationResponse) {
    this.authenticationToken = registrationResponse.authenticationToken;
    this.sessionKey = registrationResponse.sessionKey;
    this.userId = registrationResponse.userId;
    this.publicIp = registrationResponse.publicIp;
    this.rtcIceServers = registrationResponse.rtcIceServers;
  }

  public getAuthenticationToken(): string {
    return this.authenticationToken;
  }

  public getSessionKey(): string {
    return this.sessionKey;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getPublicIp(): string {
    return this.publicIp;
  }

  public getRTCIceServers(): RTCIceServer[] {
    return this.rtcIceServers;
  }
}
