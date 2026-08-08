import { SceneRegistry } from "../../engine/services/scene-registry.js";
import { container } from "../../engine/services/di-container.js";
import { GameState } from "../../engine/models/game-state.js";
import { EventConsumerService } from "../../engine/services/gameplay/event-consumer-service.js";
import { GameSceneType } from "../enums/scene-type.js";
import { ReplayScene } from "../scenes/replay/replay-scene.js";

SceneRegistry.register(GameSceneType.World, () => {
  return new ReplayScene(
    container.get(GameState),
    container.get(EventConsumerService),
  );
});
