import { GameServer } from "../models/game-server.ts";
import type { ConfigurationType } from "../types/configuration-type.ts";

export function getConfigurationKey<T>(
  key: string,
  defaultValue: T,
  gameServer: GameServer
): T {
  const configuration: ConfigurationType | null = gameServer.getConfiguration();

  if (configuration === null) {
    return defaultValue;
  }

  if (key in configuration === false) {
    console.warn(`Configuration key not found: ${key}`);

    return defaultValue;
  }

  return configuration[key] as T;
}
