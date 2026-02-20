import type { ConfigurationType } from "../types/configuration-type.js";
import {
  type PersistedServerRegistration,
  ServerRegistration,
} from "./server-registration.js";

const SERVER_REGISTRATION_STORAGE_KEY = "hoodBall.serverRegistration";

export class GameServer {
  private serverRegistration: ServerRegistration | null = null;
  private configuration: ConfigurationType | null = null;

  private connected: boolean = false;

  getServerRegistration(): ServerRegistration | null {
    return this.serverRegistration;
  }

  setServerRegistration(serverRegistration: ServerRegistration): void {
    this.serverRegistration = serverRegistration;
    this.persistServerRegistration();
  }

  clearServerRegistration(): void {
    this.serverRegistration = null;

    try {
      localStorage.removeItem(SERVER_REGISTRATION_STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear server registration", error);
    }
  }

  restoreServerRegistration(accessToken: string): boolean {
    try {
      const serialized = localStorage.getItem(SERVER_REGISTRATION_STORAGE_KEY);

      if (serialized === null) {
        return false;
      }

      const persisted = JSON.parse(serialized) as PersistedServerRegistration;

      if (
        typeof persisted.userId !== "string" ||
        typeof persisted.userDisplayName !== "string" ||
        typeof persisted.userPublicIp !== "string" ||
        typeof persisted.userSymmetricKey !== "string" ||
        typeof persisted.serverSignaturePublicKey !== "string" ||
        Array.isArray(persisted.rtcIceServers) === false
      ) {
        console.warn("Invalid persisted server registration shape, clearing it");
        localStorage.removeItem(SERVER_REGISTRATION_STORAGE_KEY);
        return false;
      }

      this.serverRegistration = ServerRegistration.fromPersisted(
        persisted,
        accessToken
      );

      return true;
    } catch (error) {
      console.warn("Failed to restore server registration", error);
      return false;
    }
  }

  private persistServerRegistration(): void {
    if (this.serverRegistration === null) {
      return;
    }

    try {
      localStorage.setItem(
        SERVER_REGISTRATION_STORAGE_KEY,
        JSON.stringify(this.serverRegistration.toPersisted())
      );
    } catch (error) {
      console.warn("Failed to persist server registration", error);
    }
  }

  getConfiguration(): ConfigurationType | null {
    return this.configuration;
  }

  setConfiguration(configuration: ConfigurationType): void {
    this.configuration = configuration;
  }

  isConnected(): boolean {
    return this.connected;
  }

  setConnected(connected: boolean): void {
    this.connected = connected;
  }
}
