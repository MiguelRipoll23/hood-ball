import { GamePlayer } from "../../game/models/game-player.js";
import { EntityType } from "../../game/enums/entity-type.js";
import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../interfaces/entities/multiplayer-game-entity.js";
import { BaseGameScene } from "./base-game-scene.js";
import type { MultiplayerScene } from "../../game/interfaces/scenes/multiplayer-scene.js";
import { SceneType } from "../../game/enums/scene-type.js";
import { BaseMultiplayerGameEntity } from "../entities/base-multiplayer-entity.js";

export class BaseMultiplayerScene
  extends BaseGameScene
  implements MultiplayerScene
{
  protected syncableEntityTypes: Map<EntityType, StaticMultiplayerGameEntity> =
    new Map();

  public getTypeId(): SceneType {
    return SceneType.Unknown;
  }

  public addSyncableEntity(entityClass: StaticMultiplayerGameEntity): void {
    const typeId = entityClass.getTypeId();
    this.syncableEntityTypes.set(typeId, entityClass);
  }

  public getSyncableEntityClass(
    typeId: EntityType
  ): StaticMultiplayerGameEntity | null {
    return this.syncableEntityTypes.get(typeId) ?? null;
  }

  public getSyncableEntities(): MultiplayerGameEntity[] {
    const result: MultiplayerGameEntity[] = [];

    for (const entity of this.uiEntities) {
      if (
        entity instanceof BaseMultiplayerGameEntity &&
        entity.getId() !== null
      ) {
        result.push(entity);
      }
    }

    for (const entity of this.worldEntities) {
      if (
        entity instanceof BaseMultiplayerGameEntity &&
        entity.getId() !== null
      ) {
        result.push(entity);
      }
    }

    return result;
  }

  public getSyncableEntity(id: string): BaseMultiplayerGameEntity | null {
    for (const entity of this.uiEntities) {
      if (
        entity instanceof BaseMultiplayerGameEntity &&
        entity.getId() === id
      ) {
        return entity;
      }
    }

    for (const entity of this.worldEntities) {
      if (
        entity instanceof BaseMultiplayerGameEntity &&
        entity.getId() === id
      ) {
        return entity;
      }
    }

    return null;
  }

  public getEntitiesByOwner(player: GamePlayer): BaseMultiplayerGameEntity[] {
    const result: BaseMultiplayerGameEntity[] = [];

    this.uiEntities.forEach((entity) => {
      if (
        entity instanceof BaseMultiplayerGameEntity &&
        entity.getOwner() === player
      ) {
        result.push(entity);
      }
    });

    this.worldEntities.forEach((entity) => {
      if (
        entity instanceof BaseMultiplayerGameEntity &&
        entity.getOwner() === player
      ) {
        result.push(entity);
      }
    });

    return result;
  }
}
