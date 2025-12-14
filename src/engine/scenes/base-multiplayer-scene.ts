import { EntityType } from "../enums/entity-type.js";
import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../interfaces/entities/multiplayer-game-entity-interface.js";
import { BaseGameScene } from "./base-game-scene.js";
import type { MultiplayerScene } from "../interfaces/scenes/multiplayer-scene-interface.js";
import { SceneType } from "../enums/scene-type.js";
import { BaseMultiplayerGameEntity } from "../entities/base-multiplayer-entity.js";

import type { Player } from "../interfaces/models/player-interface.js";

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
      if (entity instanceof BaseMultiplayerGameEntity && entity.isSyncable()) {
        result.push(entity);
      }
    }

    for (const entity of this.worldEntities) {
      if (entity instanceof BaseMultiplayerGameEntity && entity.isSyncable()) {
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

  public getEntitiesByOwner(player: Player): BaseMultiplayerGameEntity[] {
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
