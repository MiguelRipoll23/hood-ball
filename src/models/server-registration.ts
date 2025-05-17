import { AuthenticationResponse } from "../interfaces/response/authentication-response.js";

export class ServerRegistration {
  private authenticationToken: string;
  private sessionKey: string;
  private userId: string;
  private publicIp: string;
  private rtcIceServers: RTCIceServer[];

  constructor(registrationResponse: AuthenticationResponse) {
    this.authenticationToken = registrationResponse.authentication_token;
    this.sessionKey = registrationResponse.session_key;
    this.userId = registrationResponse.user_id;
    this.publicIp = registrationResponse.public_ip;
    this.rtcIceServers = registrationResponse.rtc_ice_servers;
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
