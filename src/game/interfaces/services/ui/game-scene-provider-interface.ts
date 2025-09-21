import type { GameScene } from "../../../../core/interfaces/scenes/game-scene.js";
import type { GameState } from "../../../state/game-state.js";
import type { EventConsumerService } from "@engine/services/events/event-consumer-service.js";

export interface GameSceneProviderContract {
  createRootScene(gameState: GameState, eventConsumer: EventConsumerService): GameScene;
  createLoginScene(gameState: GameState, eventConsumer: EventConsumerService): GameScene;
  createMainMenuScene(gameState: GameState, eventConsumer: EventConsumerService, showNews: boolean): GameScene;
}
