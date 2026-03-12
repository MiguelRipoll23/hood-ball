import type { ConfigurationType } from "../types/configuration-type.js";
import { ServerRegistration } from "./server-registration.js";

export class GameServer {
  private serverRegistration: ServerRegistration | null = null;
  private configuration: ConfigurationType | null = null;

  private connected: boolean = false;

  public getServerRegistration(): ServerRegistration | null {
    return this.serverRegistration;
  }

  public setServerRegistration(serverRegistration: ServerRegistration): void {
    this.serverRegistration = serverRegistration;
  }

  public clearServerRegistration(): void {
    this.serverRegistration = null;
  }

  public getConfiguration(): ConfigurationType | null {
    return this.configuration;
  }

  public setConfiguration(configuration: ConfigurationType): void {
    this.configuration = configuration;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public setConnected(connected: boolean): void {
    this.connected = connected;
  }
}
