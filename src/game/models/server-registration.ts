import type { AuthenticationResponse } from "../interfaces/responses/authentication-response-interface.js";

export class ServerRegistration {
  private authenticationToken: string;
  private userId: string;
  private userDisplayName: string;
  private userPublicIp: string;
  private userSymmetricKey: string;
  private serverSignaturePublicKey: string;
  private rtcIceServers: RTCIceServer[];

  constructor(registrationResponse: AuthenticationResponse) {
    this.authenticationToken = registrationResponse.authenticationToken;
    this.userId = registrationResponse.userId;
    this.userDisplayName = registrationResponse.userDisplayName;
    this.userPublicIp = registrationResponse.userPublicIp;
    this.userSymmetricKey = registrationResponse.userSymmetricKey;
    this.serverSignaturePublicKey =
      registrationResponse.serverSignaturePublicKey;
    this.rtcIceServers = registrationResponse.rtcIceServers;
  }

  public getAuthenticationToken(): string {
    return this.authenticationToken;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getUserDisplayName(): string {
    return this.userDisplayName;
  }

  public getUserPublicIp(): string {
    return this.userPublicIp;
  }

  public getUserSymmetricKey(): string {
    return this.userSymmetricKey;
  }

  public getServerSignaturePublicKey(): string {
    return this.serverSignaturePublicKey;
  }

  public getRTCIceServers(): RTCIceServer[] {
    return this.rtcIceServers;
  }
}
