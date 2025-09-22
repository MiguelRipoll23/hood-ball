import { GamePlayer } from "@game/models/game-player.js";
import { EntityType } from "@game/enums/entity-type.js";
import type {
  MultiplayerGameEntity,
  StaticMultiplayerGameEntity,
} from "@engine/interfaces/entities/multiplayer-game-entity.js";
import type { GameEntity } from "@engine/models/game-entity.js";
import { BaseGameScene } from "@game/scenes/base/base-game-scene.js";
import type { MultiplayerScene } from "@game/interfaces/scenes/multiplayer-scene.js";
import { SceneType } from "@game/enums/scene-type.js";
import { BaseMultiplayerGameEntity } from "@engine/entities/base-multiplayer-entity.js";

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

    const collect = (candidate: GameEntity): void => {
      if (
        candidate instanceof BaseMultiplayerGameEntity &&
        candidate.getId() !== null
      ) {
        result.push(this.castToGameMultiplayerEntity(candidate));
      }
    };

    this.uiEntities.forEach(collect);
    this.worldEntities.forEach(collect);

    return result;
  }

  private castToGameMultiplayerEntity(
    entity: BaseMultiplayerGameEntity
  ): MultiplayerGameEntity<EntityType, GamePlayer> {
    return entity as unknown as MultiplayerGameEntity<EntityType, GamePlayer>;
  }

  public getSyncableEntity(id: string): MultiplayerGameEntity<EntityType, GamePlayer> | null {
    for (const entity of this.uiEntities) {
      if (
        entity instanceof BaseMultiplayerGameEntity &&
        entity.getId() === id
      ) {
        return this.castToGameMultiplayerEntity(entity);
      }
    }

    for (const entity of this.worldEntities) {
      if (
        entity instanceof BaseMultiplayerGameEntity &&
        entity.getId() === id
      ) {
        return this.castToGameMultiplayerEntity(entity);
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
