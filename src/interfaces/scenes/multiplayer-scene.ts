import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../entities/multiplayer-game-entity.js";
import { SceneType } from "../../enums/scene-type.js";
import type { GameScene } from "./game-scene.js";
import type { EntityType } from "../../enums/entity-type.js";

export interface MultiplayerScene extends GameScene {
  getTypeId(): SceneType;
  getSyncableObjects(): MultiplayerGameEntity[];
  getSyncableObjectClass(
    typeId: EntityType
  ): StaticMultiplayerGameEntity | null;
  getSyncableObject(objectId: string): MultiplayerGameEntity | null;
}
