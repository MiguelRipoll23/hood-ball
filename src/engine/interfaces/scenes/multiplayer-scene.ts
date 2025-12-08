import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../entities/multiplayer-game-entity.js";
import { SceneType } from "../../../game/enums/scene-type.js";
import type { GameScene } from "./game-scene.js";
import type { EntityType } from "../../../game/enums/entity-type.js";

export interface MultiplayerScene extends GameScene {
  getTypeId(): SceneType;
  getSyncableEntities(): MultiplayerGameEntity[];
  getSyncableEntityClass(
    typeId: EntityType
  ): StaticMultiplayerGameEntity | null;
  getSyncableEntity(entityId: string): MultiplayerGameEntity | null;
}
