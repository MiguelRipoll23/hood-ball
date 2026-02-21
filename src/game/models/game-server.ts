import type { ConfigurationType } from "../types/configuration-type.js";
import { ServerRegistration } from "./server-registration.js";

export class GameServer {
  private serverRegistration: ServerRegistration | null = null;
  private configuration: ConfigurationType | null = null;

  private connected: boolean = false;

  getServerRegistration(): ServerRegistration | null {
    return this.serverRegistration;
  }

  setServerRegistration(serverRegistration: ServerRegistration): void {
    this.serverRegistration = serverRegistration;
  }

  clearServerRegistration(): void {
    this.serverRegistration = null;
  }

  restoreServerRegistration(_: string): boolean {
    // restoring server registration from localStorage is no longer supported
    // to avoid rehydrating tokens after a page reload. Return false to
    // indicate restore did not occur.
    return false;
  }

  // persistence removed; no-op

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
