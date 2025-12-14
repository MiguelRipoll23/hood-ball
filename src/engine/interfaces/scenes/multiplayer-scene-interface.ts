import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../entities/multiplayer-game-entity-interface.js";
import type { GameScene } from "./game-scene-interface.js";
import type { EntityType } from "../../../game/enums/entity-type.js";

export interface MultiplayerScene extends GameScene {
  getSyncableEntities(): MultiplayerGameEntity[];
  getSyncableEntityClass(
    typeId: EntityType
  ): StaticMultiplayerGameEntity | null;
  getSyncableEntity(entityId: string): MultiplayerGameEntity | null;
}
