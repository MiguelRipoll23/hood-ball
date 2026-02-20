import type { AuthenticationResponse } from "../interfaces/responses/authentication-response-interface.js";

export interface PersistedServerRegistration {
  userId: string;
  userDisplayName: string;
  userPublicIp: string;
  userSymmetricKey: string;
  serverSignaturePublicKey: string;
  rtcIceServers: RTCIceServer[];
}

export class ServerRegistration {
  private accessToken: string;
  private userId: string;
  private userDisplayName: string;
  private userPublicIp: string;
  private userSymmetricKey: string;
  private serverSignaturePublicKey: string;
  private rtcIceServers: RTCIceServer[];

  constructor(registrationResponse: AuthenticationResponse) {
    this.accessToken = registrationResponse.accessToken;
    this.userId = registrationResponse.userId;
    this.userDisplayName = registrationResponse.userDisplayName;
    this.userPublicIp = registrationResponse.userPublicIp;
    this.userSymmetricKey = registrationResponse.userSymmetricKey;
    this.serverSignaturePublicKey =
      registrationResponse.serverSignaturePublicKey;
    this.rtcIceServers = registrationResponse.rtcIceServers;
  }

  public static fromPersisted(
    persisted: PersistedServerRegistration,
    accessToken: string
  ): ServerRegistration {
    return new ServerRegistration({
      accessToken,
      refreshToken: "",
      userId: persisted.userId,
      userDisplayName: persisted.userDisplayName,
      userPublicIp: persisted.userPublicIp,
      userSymmetricKey: persisted.userSymmetricKey,
      serverSignaturePublicKey: persisted.serverSignaturePublicKey,
      rtcIceServers: persisted.rtcIceServers,
    });
  }

  public toPersisted(): PersistedServerRegistration {
    return {
      userId: this.userId,
      userDisplayName: this.userDisplayName,
      userPublicIp: this.userPublicIp,
      userSymmetricKey: this.userSymmetricKey,
      serverSignaturePublicKey: this.serverSignaturePublicKey,
      rtcIceServers: this.rtcIceServers,
    };
  }

  public getAccessToken(): string {
    return this.accessToken;
  }

  public setAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
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
