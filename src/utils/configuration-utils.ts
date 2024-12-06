import { GameState } from "../models/game-state.js";
import { ConfigurationType } from "../types/configuration-type.js";

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
    return defaultValue;
  }

  return configuration[key] as T;
}
