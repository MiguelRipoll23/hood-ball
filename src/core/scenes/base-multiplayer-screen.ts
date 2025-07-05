import { GamePlayer } from "../../models/game-player.js";
import { ObjectType } from "../../enums/object-type.js";
import { BaseMultiplayerGameEntity } from "../../entities/base/base-multiplayer-entity.js";
import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../../interfaces/entities/multiplayer-game-entity.js";
import { BaseGameScreen } from "./base-game-screen.js";
import type { MultiplayerScreen } from "../../interfaces/screens/multiplayer-screen.js";
import { ScreenType } from "../../enums/screen-type.js";

export class BaseMultiplayerScreen
  extends BaseGameScreen
  implements MultiplayerScreen
{
  protected syncableObjectTypes: Map<ObjectType, StaticMultiplayerGameEntity> =
    new Map();

  public getTypeId(): ScreenType {
    return ScreenType.Unknown;
  }

  public addSyncableObject(objectClass: StaticMultiplayerGameEntity): void {
    const typeId = objectClass.getTypeId();
    this.syncableObjectTypes.set(typeId, objectClass);
  }

  public getSyncableObjectClass(
    typeId: ObjectType
  ): StaticMultiplayerGameEntity | null {
    return this.syncableObjectTypes.get(typeId) ?? null;
  }

  public getSyncableObjects(): MultiplayerGameEntity[] {
    const result: MultiplayerGameEntity[] = [];

    for (const object of this.uiObjects) {
      if (
        object instanceof BaseMultiplayerGameEntity &&
        object.getId() !== null
      ) {
        result.push(object);
      }
    }

    for (const object of this.sceneObjects) {
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
    for (const object of this.uiObjects) {
      if (
        object instanceof BaseMultiplayerGameEntity &&
        object.getId() === id
      ) {
        return object;
      }
    }

    for (const object of this.sceneObjects) {
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

    this.uiObjects.forEach((object) => {
      if (
        object instanceof BaseMultiplayerGameEntity &&
        object.getOwner() === player
      ) {
        result.push(object);
      }
    });

    this.sceneObjects.forEach((object) => {
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
