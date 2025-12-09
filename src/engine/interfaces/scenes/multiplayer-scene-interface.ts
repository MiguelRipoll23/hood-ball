import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../entities/multiplayer-game-entity-interface.ts";
import { SceneType } from "../../enums/scene-type.ts";
import type { GameScene } from "./game-scene-interface.ts";
import type { EntityType } from "../../enums/entity-type.ts";

export interface MultiplayerScene extends GameScene {
  getTypeId(): SceneType;
  getSyncableEntities(): MultiplayerGameEntity[];
  getSyncableEntityClass(
    typeId: EntityType
  ): StaticMultiplayerGameEntity | null;
  getSyncableEntity(entityId: string): MultiplayerGameEntity | null;
}
