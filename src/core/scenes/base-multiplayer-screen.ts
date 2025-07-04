import { GamePlayer } from "../../models/game-player.js";
import { ObjectType } from "../../enums/object-type.js";
import { BaseMultiplayerGameObject } from "../../objects/base/base-multiplayer-object.js";
import type {
  MultiplayerGameObject,
  StaticMultiplayerGameObject,
} from "../../interfaces/objects/multiplayer-game-object.js";
import { BaseGameScreen } from "./base-game-screen.js";
import type { MultiplayerScreen } from "../../interfaces/screens/multiplayer-screen.js";
import { ScreenType } from "../../enums/screen-type.js";

export class BaseMultiplayerScreen
  extends BaseGameScreen
  implements MultiplayerScreen
{
  protected syncableObjectTypes: Map<ObjectType, StaticMultiplayerGameObject> =
    new Map();

  public getTypeId(): ScreenType {
    return ScreenType.Unknown;
  }

  public addSyncableObject(objectClass: StaticMultiplayerGameObject): void {
    const typeId = objectClass.getTypeId();
    this.syncableObjectTypes.set(typeId, objectClass);
  }

  public getSyncableObjectClass(
    typeId: ObjectType
  ): StaticMultiplayerGameObject | null {
    return this.syncableObjectTypes.get(typeId) ?? null;
  }

  public getSyncableObjects(): MultiplayerGameObject[] {
    const result: MultiplayerGameObject[] = [];

    for (const object of this.uiObjects) {
      if (
        object instanceof BaseMultiplayerGameObject &&
        object.getId() !== null
      ) {
        result.push(object);
      }
    }

    for (const object of this.sceneObjects) {
      if (
        object instanceof BaseMultiplayerGameObject &&
        object.getId() !== null
      ) {
        result.push(object);
      }
    }

    return result;
  }

  public getSyncableObject(id: string): BaseMultiplayerGameObject | null {
    for (const object of this.uiObjects) {
      if (
        object instanceof BaseMultiplayerGameObject &&
        object.getId() === id
      ) {
        return object;
      }
    }

    for (const object of this.sceneObjects) {
      if (
        object instanceof BaseMultiplayerGameObject &&
        object.getId() === id
      ) {
        return object;
      }
    }

    return null;
  }

  public getObjectsByOwner(player: GamePlayer): BaseMultiplayerGameObject[] {
    const result: BaseMultiplayerGameObject[] = [];

    this.uiObjects.forEach((object) => {
      if (
        object instanceof BaseMultiplayerGameObject &&
        object.getOwner() === player
      ) {
        result.push(object);
      }
    });

    this.sceneObjects.forEach((object) => {
      if (
        object instanceof BaseMultiplayerGameObject &&
        object.getOwner() === player
      ) {
        result.push(object);
      }
    });

    return result;
  }
}
