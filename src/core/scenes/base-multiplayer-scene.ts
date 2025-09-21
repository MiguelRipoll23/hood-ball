import { GamePlayer } from "../../game/models/game-player.js";
import { EntityType } from "../../game/enums/entity-type.js";
import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "@engine/interfaces/entities/multiplayer-game-entity.js";
import { BaseGameScene } from "./base-game-scene.js";
import type { MultiplayerScene } from "../interfaces/scenes/multiplayer-scene.js";
import { SceneType } from "../../game/enums/scene-type.js";
import { BaseMultiplayerGameEntity } from "../entities/base-multiplayer-entity.js";

export class BaseMultiplayerScene
  extends BaseGameScene
  implements MultiplayerScene
{
  protected syncableEntityTypes: Map<EntityType, StaticMultiplayerGameEntity<EntityType, GamePlayer>> =
    new Map();

  public getTypeId(): SceneType {
    return SceneType.Unknown;
  }

  public addSyncableEntity(
    entityClass: StaticMultiplayerGameEntity<EntityType, GamePlayer>
  ): void {
    const typeId = entityClass.getTypeId();
    this.syncableEntityTypes.set(typeId, entityClass);
  }

  public getSyncableEntityClass(
    typeId: EntityType
  ): StaticMultiplayerGameEntity<EntityType, GamePlayer> | null {
    return this.syncableEntityTypes.get(typeId) ?? null;
  }

  public getSyncableEntities(): MultiplayerGameEntity<EntityType, GamePlayer>[] {
    const result: MultiplayerGameEntity<EntityType, GamePlayer>[] = [];

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
