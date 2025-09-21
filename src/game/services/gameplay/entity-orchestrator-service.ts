import type { MultiplayerGameEntity } from "@engine/interfaces/entities/multiplayer-game-entity.js";
import type { GamePlayer } from "../../models/game-player.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { GameState } from "../../state/game-state.js";
import { EntityUtils } from "@game/utils/entity-utils.js";

import type { MultiplayerScene } from "../../../core/interfaces/scenes/multiplayer-scene.js";
import { EntityStateType } from "@engine/enums/entity-state-type.js";
import { SceneUtils } from "@game/utils/scene-utils.js";
import { WebRTCType } from "../../enums/webrtc-type.js";
import { BinaryReader } from "@engine/utils/binary-reader-utils.js";
import { BinaryWriter } from "@engine/utils/binary-writer-utils.js";
import type { EntityType } from "../../enums/entity-type.js";
import { PeerCommandHandler } from "../../decorators/peer-command-handler-decorator.js";
import { inject, injectable } from "@needle-di/core";
import type { WebRTCPeer } from "../../interfaces/services/network/webrtc-peer.js";

type GameMultiplayerEntity = MultiplayerGameEntity<EntityType, GamePlayer>;


@injectable()
export class EntityOrchestratorService {
  private readonly PERIODIC_MILLISECONDS = 500;

  private elapsedMilliseconds: number = 0;
  private periodicUpdate: boolean = false;

  constructor(
    private readonly gameState: GameState = inject(GameState),
    private readonly webrtcService: WebRTCService = inject(WebRTCService)
  ) {
    this.webrtcService.registerCommandHandlers(this);
  }

  public sendLocalData(
    multiplayerScene: MultiplayerScene,
    deltaTimeStamp: DOMHighResTimeStamp
  ): void {
    if (this.gameState.getMatch() === null) {
      this.elapsedMilliseconds = 0;
      return;
    }

    this.elapsedMilliseconds += deltaTimeStamp;
    this.periodicUpdate =
      this.elapsedMilliseconds >= this.PERIODIC_MILLISECONDS;

    multiplayerScene.getSyncableEntities().forEach((multiplayerEntity) => {
      const mustSync = multiplayerEntity.mustSync();
      const mustSyncReliably = multiplayerEntity.mustSyncReliably();

      if (mustSync || mustSyncReliably || this.periodicUpdate) {
        this.sendLocalEntityData(multiplayerScene, multiplayerEntity);
      }
    });

    if (this.elapsedMilliseconds >= this.PERIODIC_MILLISECONDS) {
      this.elapsedMilliseconds = 0;
    }
  }

  @PeerCommandHandler(WebRTCType.EntityData)
  public handleEntityData(
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void {
    const sceneId = binaryReader.unsignedInt8();
    const entityStateId = binaryReader.unsignedInt8();
    const entityTypeId = binaryReader.unsignedInt8();
    const entityOwnerId = binaryReader.fixedLengthString(32);
    const entityId = binaryReader.fixedLengthString(32);
    const entityData = binaryReader.bytesAsArrayBuffer();

    // Check for owner
    if (EntityUtils.hasInvalidOwner(webrtcPeer, entityOwnerId)) {
      console.warn(
        "Received entity data from unauthorized player",
        entityOwnerId
      );
      return;
    }

    // Check for scene
    const entityMultiplayerScene = SceneUtils.getSceneById(
      this.gameState.getGameFrame(),
      sceneId
    );

    if (entityMultiplayerScene === null) {
      console.warn(`Scene not found with id ${sceneId}`);
      return;
    }

    switch (entityStateId) {
      case EntityStateType.Active:
        this.createOrSynchronizeEntity(
          entityMultiplayerScene,
          entityTypeId,
          entityOwnerId,
          entityId,
          entityData
        );
        break;

      case EntityStateType.Inactive:
        this.removeEntity(entityMultiplayerScene, entityId);
        break;

      default:
        console.warn(`Unknown entity state: ${entityStateId}`);
    }
  }


  // Local
  private sendLocalEntityData(
    multiplayerScene: MultiplayerScene,
    multiplayerEntity: GameMultiplayerEntity
  ): void {
    this.updateOwnerToSharedEntities(multiplayerEntity);

    if (this.skipUnownedEntity(multiplayerEntity)) {
      return;
    }

    this.markAsRemovedIfEntityInactive(multiplayerEntity);

    const arrayBuffer = this.getEntityDataArrayBuffer(
      multiplayerScene,
      multiplayerEntity
    );

    this.webrtcService
      .getPeers()
      .forEach((webrtcPeer) => {
        if (webrtcPeer.hasJoined()) {
          this.sendLocalEntityDataToPeer(
            multiplayerEntity,
            webrtcPeer,
            arrayBuffer
          );
        }
      });

    multiplayerEntity.setSync(false);
    multiplayerEntity.setSyncReliably(false);
  }

  private updateOwnerToSharedEntities(
    multiplayerEntity: GameMultiplayerEntity
  ) {
    const syncableByHost = multiplayerEntity.isSyncableByHost();
    const unowned = multiplayerEntity.getOwner() === null;

    if (syncableByHost && unowned) {
      const hostPlayer = this.gameState.getMatch()?.getHost() ?? null;
      multiplayerEntity.setOwner(hostPlayer);
    }
  }

  private skipUnownedEntity(multiplayerEntity: GameMultiplayerEntity): boolean {
    // If host, don't skip entities from other players
    if (this.gameState.getMatch()?.isHost()) {
      return false;
    }

    // Is entity not owned by the player?
    const playerId = this.gameState.getGamePlayer().getNetworkId();
    const ownerId = multiplayerEntity.getOwner()?.getNetworkId();

    return ownerId !== playerId;
  }

  private markAsRemovedIfEntityInactive(
    multiplayerEntity: GameMultiplayerEntity
  ): void {
    if (multiplayerEntity.getState() === EntityStateType.Inactive) {
      multiplayerEntity.setRemoved(true);
    }
  }

  private getEntityDataArrayBuffer(
    multiplayerScene: MultiplayerScene,
    multiplayerEntity: GameMultiplayerEntity
  ): ArrayBuffer {
    const sceneTypeId = multiplayerScene.getTypeId();
    const entityStateId = multiplayerEntity.getState();
    const entityTypeId = multiplayerEntity.getTypeId();
    const entityOwnerId = multiplayerEntity.getOwner()?.getNetworkId() ?? null;
    const entityId = multiplayerEntity.getId();

    if (entityTypeId === null || entityId === null || entityOwnerId === null) {
      throw new Error("Invalid entity data for entity id " + entityId);
    }

    const entityData = multiplayerEntity.serialize();

    return BinaryWriter.build()
      .unsignedInt8(WebRTCType.EntityData)
      .unsignedInt8(sceneTypeId)
      .unsignedInt8(entityStateId)
      .unsignedInt8(entityTypeId)
      .fixedLengthString(entityOwnerId, 32)
      .fixedLengthString(entityId, 32)
      .arrayBuffer(entityData)
      .toArrayBuffer();
  }

  private sendLocalEntityDataToPeer(
    multiplayerEntity: GameMultiplayerEntity,
    webrtcPeer: WebRTCPeer,
    dataBuffer: ArrayBuffer
  ): void {
    // Don't send data to the owner
    if (webrtcPeer.getPlayer() === multiplayerEntity.getOwner()) {
      return;
    }

    // Send reliable message if entity is removed
    if (multiplayerEntity.isRemoved()) {
      webrtcPeer.sendReliableUnorderedMessage(dataBuffer);
      return;
    }

    // Send reliable message if entity must sync
    if (multiplayerEntity.mustSyncReliably()) {
      webrtcPeer.sendReliableOrderedMessage(dataBuffer);
      return;
    }

    webrtcPeer.sendUnreliableUnorderedMessage(dataBuffer);
  }

  // Remote
  private createOrSynchronizeEntity(
    multiplayerScene: MultiplayerScene,
    entityTypeId: EntityType,
    entityOwnerId: string,
    entityId: string,
    entityData: ArrayBuffer
  ) {
    // Try to find entity
    const entity = multiplayerScene.getSyncableEntity(entityId);

    if (entity === null) {
      this.createEntity(
        multiplayerScene,
        entityTypeId,
        entityOwnerId,
        entityId,
        entityData
      );
      return;
    }

    entity.synchronize(entityData);
  }

  private createEntity(
    multiplayerScene: MultiplayerScene,
    entityTypeId: EntityType,
    entityOwnerId: string,
    entityId: string,
    entityData: ArrayBuffer
  ) {
    const entityClass = multiplayerScene.getSyncableEntityClass(entityTypeId);

    if (entityClass === null) {
      console.warn(`Entity class not found for type ${entityTypeId}`);
      return;
    }

    // Try to find owner
    const player =
      this.gameState.getMatch()?.getPlayerByNetworkId(entityOwnerId) ?? null;

    if (player === null) {
      console.warn("Cannot find player with id", entityOwnerId);
      return;
    }

    // Try to create entity instance
    let entityInstance: MultiplayerGameEntity;

    try {
      entityInstance = entityClass.deserialize(entityId, entityData);
    } catch (error) {
      console.warn("Cannot deserialize entity with id", entityId, error);
      return;
    }

    entityInstance.setOwner(player);
    multiplayerScene?.addEntityToSceneLayer(entityInstance);
    console.log("Added entity to scene layer", entityInstance);
  }

  private removeEntity(
    multiplayerScene: MultiplayerScene,
    entityId: string
  ): void {
    const entity = multiplayerScene.getSyncableEntity(entityId);

    if (entity === null) {
      console.warn(`Entity not found with id ${entityId}`);
      return;
    }

    entity.setState(EntityStateType.Inactive);
    entity.setRemoved(true);
  }
}






