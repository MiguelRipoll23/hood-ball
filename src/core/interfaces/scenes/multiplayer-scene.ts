import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "@engine/interfaces/entities/multiplayer-game-entity.js";
import { SceneType } from "../../../game/enums/scene-type.js";
import type { GamePlayer } from "../../../game/models/game-player.js";
import type { GameScene } from "./game-scene.js";
import type { EntityType } from "../../../game/enums/entity-type.js";

export interface MultiplayerScene extends GameScene {
  getTypeId(): SceneType;
  getSyncableEntities(): MultiplayerGameEntity<EntityType, GamePlayer>[];
  getSyncableEntityClass(
    typeId: EntityType
  ): StaticMultiplayerGameEntity<EntityType, GamePlayer> | null;
  getSyncableEntity(entityId: string): MultiplayerGameEntity<EntityType, GamePlayer> | null;
}
