import { GamePlayer } from "../../models/game-player.js";
import { EntityType } from "../../enums/entity-type.js";
import { BaseMultiplayerGameEntity } from "../../entities/base/base-multiplayer-entity.js";
import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../../interfaces/entities/multiplayer-game-entity.js";
import { BaseGameScene } from "./base-game-scene.js";
import type { MultiplayerScene } from "../../interfaces/scenes/multiplayer-scene.js";
import { SceneType } from "../../enums/scene-type.js";

export class BaseMultiplayerScene
  extends BaseGameScene
  implements MultiplayerScene
{
  protected syncableObjectTypes: Map<EntityType, StaticMultiplayerGameEntity> =
    new Map();

  public getTypeId(): SceneType {
    return SceneType.Unknown;
  }

  public addSyncableObject(objectClass: StaticMultiplayerGameEntity): void {
    const typeId = objectClass.getTypeId();
    this.syncableObjectTypes.set(typeId, objectClass);
  }

  public getSyncableObjectClass(
    typeId: EntityType
  ): StaticMultiplayerGameEntity | null {
    return this.syncableObjectTypes.get(typeId) ?? null;
  }

  public getSyncableObjects(): MultiplayerGameEntity[] {
    const result: MultiplayerGameEntity[] = [];

    for (const object of this.uiEntities) {
      if (
        object instanceof BaseMultiplayerGameEntity &&
        object.getId() !== null
      ) {
        result.push(object);
      }
    }

    for (const object of this.worldEntities) {
      if (
        object instanceof BaseMultiplayerGameEntity &&
        object.getId() !== null
      ) {
        result.push(object);
      }
    }

    return result;
  }

  public getSyncableObject(id: string): BaseMultiplayerGameEntity | null {
    for (const object of this.uiEntities) {
      if (
        object instanceof BaseMultiplayerGameEntity &&
        object.getId() === id
      ) {
        return object;
      }
    }

    for (const object of this.worldEntities) {
      if (
        object instanceof BaseMultiplayerGameEntity &&
        object.getId() === id
      ) {
        return object;
      }
    }

    return null;
  }

  public getObjectsByOwner(player: GamePlayer): BaseMultiplayerGameEntity[] {
    const result: BaseMultiplayerGameEntity[] = [];

    this.uiEntities.forEach((object) => {
      if (
        object instanceof BaseMultiplayerGameEntity &&
        object.getOwner() === player
      ) {
        result.push(object);
      }
    });

    this.worldEntities.forEach((object) => {
      if (
        object instanceof BaseMultiplayerGameEntity &&
        object.getOwner() === player
      ) {
        result.push(object);
      }
    });

    return result;
  }
}
