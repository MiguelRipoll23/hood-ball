import { container } from "../../core/services/di-container.js";
import { GameState } from "../state/game-state.js";
import { GameSessionState } from "../state/game-session-state.js";
import { registerGameServices } from "./register-game-services.js";
import type { BindableContainer } from "./register-game-services.js";
import { GameLoopFacade } from "../loop/game-loop-facade.js";
import { ENGINE_CONTEXT_TOKEN } from "@engine/state/engine-context.js";

interface ContainerContract extends BindableContainer {
  get: <T>(token: new (...args: never[]) => T) => T;
  has?: <T>(token: new (...args: never[]) => T) => boolean;
}

export type StartGameResult = {
  container: ContainerContract;
  gameLoop: GameLoopFacade;
};

export function startGame(
  canvas: HTMLCanvasElement,
  debugging: boolean
): StartGameResult {
  const target = container as ContainerContract;

  if (target.has?.(GameState)) {
    throw new Error("GameState has already been registered");
  }

  const sessionState = new GameSessionState();
  const gameState = new GameState(canvas, debugging, sessionState);
  target.bind({ provide: GameState, useValue: gameState });
  target.bind({ provide: ENGINE_CONTEXT_TOKEN, useValue: gameState });
  registerGameServices(target);

  const gameLoopFacade = target.get(GameLoopFacade);
  gameLoopFacade.initialize({ canvas, debugging });

  return {
    container: target,
    gameLoop: gameLoopFacade,
  };
}

