import { GameServer } from "../models/game-server.js";
import type { ConfigurationType } from "../types/configuration-type.js";
import { EngineLogger } from "../../engine/services/engine-logger.js";

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
    EngineLogger.warn("ConfigurationUtils", `Configuration key not found: ${key}`);

    return defaultValue;
  }

  return configuration[key] as T;
}
