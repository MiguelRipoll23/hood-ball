import type { GameState } from "../../../state/game-state.js";
import type { EventConsumerService } from "@engine/services/events/event-consumer-service.js";
import type { GameScene } from "@engine/interfaces/scenes/game-scene.js";
import type { RootGameScene } from "@game/interfaces/scenes/root-game-scene.js";
import type { MainMenuSceneContract } from "@game/interfaces/scenes/main-menu-scene-contract.js";

export interface GameSceneProviderContract {
  createRootScene(
    gameState: GameState,
    eventConsumer: EventConsumerService
  ): RootGameScene;
  createLoginScene(
    gameState: GameState,
    eventConsumer: EventConsumerService
  ): GameScene;
  createMainMenuScene(
    gameState: GameState,
    eventConsumer: EventConsumerService,
    showNews: boolean
  ): MainMenuSceneContract;
}
