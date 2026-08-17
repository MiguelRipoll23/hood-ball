import type { EntityType } from "../enums/entity-type.js";
import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "../interfaces/entities/multiplayer-game-entity-interface.js";
import { BaseGameScene } from "./base-game-scene.js";
import type { MultiplayerScene } from "../interfaces/scenes/multiplayer-scene-interface.js";

import type { Player } from "../interfaces/models/player-interface.js";
import type { GameEntity } from "../models/game-entity.js";

export class BaseMultiplayerScene
  extends BaseGameScene
  implements MultiplayerScene
{
  protected syncableEntityTypes: Map<EntityType, StaticMultiplayerGameEntity> =
    new Map();

  /**
   * Cached result of {@link getSyncableEntities}, rebuilt only when the
   * scene's entity lists change. Avoids allocating a new array every frame
   * in the entity orchestrator's per-frame send loop.
   */
  private syncableEntitiesCache: MultiplayerGameEntity[] | null = null;

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
    if (this.syncableEntitiesCache === null) {
      this.syncableEntitiesCache = this.buildSyncableEntities();
    }

    return this.syncableEntitiesCache;
  }

  public override addEntityToSceneLayer(entity: GameEntity): void {
    super.addEntityToSceneLayer(entity);
    this.syncableEntitiesCache = null;
  }

  protected override deleteEntityIfRemoved(
    layer: GameEntity[],
    entity: GameEntity
  ): void {
    if (entity.isRemoved()) {
      super.deleteEntityIfRemoved(layer, entity);
      this.syncableEntitiesCache = null;
    }
  }

  private buildSyncableEntities(): MultiplayerGameEntity[] {
    const result: MultiplayerGameEntity[] = [];

    for (const entity of this.uiEntities) {
      if (this.isMultiplayerEntity(entity) && entity.isSyncable()) {
        result.push(entity);
      }
    }

    for (const entity of this.worldEntities) {
      if (this.isMultiplayerEntity(entity) && entity.isSyncable()) {
        result.push(entity);
      }
    }

    return result;
  }

  public getSyncableEntity(id: string): MultiplayerGameEntity | null {
    for (const entity of this.uiEntities) {
      if (
        this.isMultiplayerEntity(entity) &&
        entity.getId() === id
      ) {
        return entity;
      }
    }

    for (const entity of this.worldEntities) {
      if (
        this.isMultiplayerEntity(entity) &&
        entity.getId() === id
      ) {
        return entity;
      }
    }

    return null;
  }

  public getEntitiesByOwner(player: Player): MultiplayerGameEntity[] {
    const result: MultiplayerGameEntity[] = [];

    this.uiEntities.forEach((entity) => {
      if (
        this.isMultiplayerEntity(entity) &&
        entity.getOwner() === player
      ) {
        result.push(entity);
      }
    });

    this.worldEntities.forEach((entity) => {
      if (
        this.isMultiplayerEntity(entity) &&
        entity.getOwner() === player
      ) {
        result.push(entity);
      }
    });

    return result;
  }

  private isMultiplayerEntity(
    entity: GameEntity,
  ): entity is MultiplayerGameEntity {
    return (
      "getOwner" in entity &&
      "isSyncable" in entity &&
      "serialize" in entity
    );
  }
}
