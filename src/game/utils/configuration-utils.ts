import { GameState } from "../../engine/models/game-state.js";
import type { ConfigurationType } from "../types/configuration-type.js";

export function getConfigurationKey<T>(
  key: string,
  defaultValue: T,
  gameState: GameState
): T {
  const configuration: ConfigurationType | null = gameState
    .getGameServer()
    .getConfiguration();

  if (configuration === null) {
    return defaultValue;
  }

  if (key in configuration === false) {
    console.warn(`Configuration key not found: ${key}`);

    return defaultValue;
  }

  return configuration[key] as T;
}
