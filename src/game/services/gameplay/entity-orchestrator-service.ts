import type { MultiplayerGameEntity } from "../../../core/entities/multiplayer-game-entity.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { GameState } from "../../../core/models/game-state.js";
import { EntityUtils } from "../../../core/utils/entity-utils.js";
import type { MultiplayerScene } from "../../interfaces/scenes/multiplayer-scene.js";
import { EntityStateType } from "../../../core/enums/entity-state-type.js";
import { SceneUtils } from "../../../core/utils/scene-utils.js";
import { WebRTCType } from "../../enums/webrtc-type.js";
import { BinaryReader } from "../../../core/utils/binary-reader-utils.js";
import { BinaryWriter } from "../../../core/utils/binary-writer-utils.js";
import type { EntityType } from "../../enums/entity-type.js";
import { PeerCommandHandler } from "../../decorators/peer-command-handler-decorator.js";
import { container } from "../../../core/services/di-container.js";
import { injectable } from "@needle-di/core";
import type { WebRTCPeer } from "../../interfaces/services/network/webrtc-peer.js";

@injectable()
export class EntityOrchestratorService {
  private readonly PERIODIC_MILLISECONDS = 500;

  private webrtcService: WebRTCService | null = null;
  private elapsedMilliseconds: number = 0;
  private periodicUpdate: boolean = false;

  constructor(private gameState = container.get(GameState)) {}

  public initialize(): void {
    this.webrtcService = container.get(WebRTCService);
    this.webrtcService!.registerCommandHandlers(this);
    console.log("Entity orchestrator service initialized");
  }

  public sendLocalData(
    multiplayerScene: MultiplayerScene,
    deltaTimeStamp: number
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
      return console.warn(
        "Received entity data from unauthorized player",
        entityOwnerId
      );
    }

    // Check for scene
    const entityMultiplayerScene = SceneUtils.getSceneById(
      this.gameState.getGameFrame(),
      sceneId
    );

    if (entityMultiplayerScene === null) {
      return console.warn(`Scene not found with id ${sceneId}`);
    }

    switch (entityStateId) {
      case EntityStateType.Active:
        return this.createOrSynchronizeEntity(
          entityMultiplayerScene,
          entityTypeId,
          entityOwnerId,
          entityId,
          entityData
        );

      case EntityStateType.Inactive:
        return this.removeEntity(entityMultiplayerScene, entityId);

      default:
        console.warn(`Unknown entity state: ${entityStateId}`);
    }
  }

  private getWebRTCService(): WebRTCService {
    if (this.webrtcService === null) {
      throw new Error("WebRTCService is not initialized");
    }

    return this.webrtcService;
  }

  // Local
  private sendLocalEntityData(
    multiplayerScene: MultiplayerScene,
    multiplayerEntity: MultiplayerGameEntity
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

    this.getWebRTCService()
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
    multiplayerEntity: MultiplayerGameEntity
  ) {
    const syncableByHost = multiplayerEntity.isSyncableByHost();
    const unowned = multiplayerEntity.getOwner() === null;

    if (syncableByHost && unowned) {
      const hostPlayer = this.gameState.getMatch()?.getHost() ?? null;
      multiplayerEntity.setOwner(hostPlayer);
    }
  }

  private skipUnownedEntity(multiplayerEntity: MultiplayerGameEntity): boolean {
    // If host, don't skip entitys from other players
    if (this.gameState.getMatch()?.isHost()) {
      return false;
    }

    // Is entity not owned by the player?
    const playerId = this.gameState.getGamePlayer().getId();
    const ownerId = multiplayerEntity.getOwner()?.getId();

    return ownerId !== playerId;
  }

  private markAsRemovedIfEntityInactive(
    multiplayerEntity: MultiplayerGameEntity
  ): void {
    if (multiplayerEntity.getState() === EntityStateType.Inactive) {
      multiplayerEntity.setRemoved(true);
    }
  }

  private getEntityDataArrayBuffer(
    multiplayerScene: MultiplayerScene,
    multiplayerEntity: MultiplayerGameEntity
  ): ArrayBuffer {
    const sceneTypeId = multiplayerScene.getTypeId();
    const entityStateId = multiplayerEntity.getState();
    const entityTypeId = multiplayerEntity.getTypeId();
    const entityOwnerId = multiplayerEntity.getOwner()?.getId() ?? null;
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
    multiplayerEntity: MultiplayerGameEntity,
    webrtcPeer: WebRTCPeer,
    dataBuffer: ArrayBuffer
  ): void {
    // Don't send data to the owner
    if (webrtcPeer.getPlayer() === multiplayerEntity.getOwner()) {
      return;
    }

    // Send reliable message if entity is removed
    if (multiplayerEntity.isRemoved()) {
      return webrtcPeer.sendReliableUnorderedMessage(dataBuffer);
    }

    // Send reliable message if entity must sync
    if (multiplayerEntity.mustSyncReliably()) {
      return webrtcPeer.sendReliableOrderedMessage(dataBuffer);
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
      return this.createEntity(
        multiplayerScene,
        entityTypeId,
        entityOwnerId,
        entityId,
        entityData
      );
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
      return console.warn(`Entity class not found for type ${entityTypeId}`);
    }

    // Try to find owner
    const player = this.gameState.getMatch()?.getPlayer(entityOwnerId) ?? null;

    if (player === null) {
      return console.warn("Cannot find player with id", entityOwnerId);
    }

    // Try to create entity instance
    let entityInstance: MultiplayerGameEntity;

    try {
      entityInstance = entityClass.deserialize(entityId, entityData);
    } catch (error) {
      return console.warn("Cannot deserialize entity with id", entityId, error);
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
      return console.warn(`Entity not found with id ${entityId}`);
    }

    entity.setState(EntityStateType.Inactive);
    entity.setRemoved(true);
  }
}
