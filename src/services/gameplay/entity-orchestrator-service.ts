import type { MultiplayerGameEntity } from "../../interfaces/entities/multiplayer-game-entity.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { GameState } from "../../core/services/game-state.js";
import type { WebRTCPeer } from "../../interfaces/webrtc-peer.js";
import { EntityUtils } from "../../core/utils/entity-utils.js";
import type { MultiplayerScene } from "../../interfaces/scenes/multiplayer-scene.js";
import { EntityStateType } from "../../core/constants/entity-state-type.js";
import { SceneUtils } from "../../core/scenes/scene-utils.js";
import { WebRTCType } from "../../enums/webrtc-type.js";
import { BinaryReader } from "../../core/utils/binary-reader-utils.js";
import { BinaryWriter } from "../../core/utils/binary-writer-utils.js";
import type { EntityType } from "../../enums/entity-type.js";
import { PeerCommandHandler } from "../../decorators/peer-command-handler-decorator.js";
import { container } from "../../core/services/di-container.js";
import { injectable } from "@needle-di/core";

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
    console.log("Object orchestrator service initialized");
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

    multiplayerScene.getSyncableObjects().forEach((multiplayerObject) => {
      const mustSync = multiplayerObject.mustSync();
      const mustSyncReliably = multiplayerObject.mustSyncReliably();

      if (mustSync || mustSyncReliably || this.periodicUpdate) {
        this.sendLocalObjectData(multiplayerScene, multiplayerObject);
      }
    });

    if (this.elapsedMilliseconds >= this.PERIODIC_MILLISECONDS) {
      this.elapsedMilliseconds = 0;
    }
  }

  @PeerCommandHandler(WebRTCType.ObjectData)
  public handleObjectData(
    webrtcPeer: WebRTCPeer,
    binaryReader: BinaryReader
  ): void {
    const screenId = binaryReader.unsignedInt8();
    const objectStateId = binaryReader.unsignedInt8();
    const objectTypeId = binaryReader.unsignedInt8();
    const objectOwnerId = binaryReader.fixedLengthString(32);
    const objectId = binaryReader.fixedLengthString(32);
    const objectData = binaryReader.bytesAsArrayBuffer();

    // Check for owner
    if (EntityUtils.hasInvalidOwner(webrtcPeer, objectOwnerId)) {
      return console.warn(
        "Received object data from unauthorized player",
        objectOwnerId
      );
    }

    // Check for screen
    const objectMultiplayerScene = SceneUtils.getScreenById(
      this.gameState.getGameFrame(),
      screenId
    );

    if (objectMultiplayerScene === null) {
      return console.warn(`Screen not found with id ${screenId}`);
    }

    switch (objectStateId) {
      case EntityStateType.Active:
        return this.createOrSynchronizeObject(
          objectMultiplayerScene,
          objectTypeId,
          objectOwnerId,
          objectId,
          objectData
        );

      case EntityStateType.Inactive:
        return this.removeObject(objectMultiplayerScene, objectId);

      default:
        console.warn(`Unknown object state: ${objectStateId}`);
    }
  }

  private getWebRTCService(): WebRTCService {
    if (this.webrtcService === null) {
      throw new Error("WebRTCService is not initialized");
    }

    return this.webrtcService;
  }

  // Local
  private sendLocalObjectData(
    multiplayerScene: MultiplayerScene,
    multiplayerObject: MultiplayerGameEntity
  ): void {
    this.updateOwnerToSharedObjects(multiplayerObject);

    if (this.skipUnownedObject(multiplayerObject)) {
      return;
    }

    this.markAsRemovedIfObjectInactive(multiplayerObject);

    const arrayBuffer = this.getObjectDataArrayBuffer(
      multiplayerScene,
      multiplayerObject
    );

    this.getWebRTCService()
      .getPeers()
      .forEach((webrtcPeer) => {
        if (webrtcPeer.hasJoined()) {
          this.sendLocalObjectDataToPeer(
            multiplayerObject,
            webrtcPeer,
            arrayBuffer
          );
        }
      });

    multiplayerObject.setSync(false);
    multiplayerObject.setSyncReliably(false);
  }

  private updateOwnerToSharedObjects(multiplayerObject: MultiplayerGameEntity) {
    const syncableByHost = multiplayerObject.isSyncableByHost();
    const unowned = multiplayerObject.getOwner() === null;

    if (syncableByHost && unowned) {
      const hostPlayer = this.gameState.getMatch()?.getHost() ?? null;
      multiplayerObject.setOwner(hostPlayer);
    }
  }

  private skipUnownedObject(multiplayerObject: MultiplayerGameEntity): boolean {
    // If host, don't skip objects from other players
    if (this.gameState.getMatch()?.isHost()) {
      return false;
    }

    // Is object not owned by the player?
    const playerId = this.gameState.getGamePlayer().getId();
    const ownerId = multiplayerObject.getOwner()?.getId();

    return ownerId !== playerId;
  }

  private markAsRemovedIfObjectInactive(
    multiplayerObject: MultiplayerGameEntity
  ): void {
    if (multiplayerObject.getState() === EntityStateType.Inactive) {
      multiplayerObject.setRemoved(true);
    }
  }

  private getObjectDataArrayBuffer(
    multiplayerScene: MultiplayerScene,
    multiplayerObject: MultiplayerGameEntity
  ): ArrayBuffer {
    const screenTypeId = multiplayerScene.getTypeId();
    const objectStateId = multiplayerObject.getState();
    const objectTypeId = multiplayerObject.getTypeId();
    const objectOwnerId = multiplayerObject.getOwner()?.getId() ?? null;
    const objectId = multiplayerObject.getId();

    if (objectTypeId === null || objectId === null || objectOwnerId === null) {
      throw new Error("Invalid object data for object id " + objectId);
    }

    const objectData = multiplayerObject.serialize();

    return BinaryWriter.build()
      .unsignedInt8(WebRTCType.ObjectData)
      .unsignedInt8(screenTypeId)
      .unsignedInt8(objectStateId)
      .unsignedInt8(objectTypeId)
      .fixedLengthString(objectOwnerId, 32)
      .fixedLengthString(objectId, 32)
      .arrayBuffer(objectData)
      .toArrayBuffer();
  }

  private sendLocalObjectDataToPeer(
    multiplayerObject: MultiplayerGameEntity,
    webrtcPeer: WebRTCPeer,
    dataBuffer: ArrayBuffer
  ): void {
    // Don't send data to the owner
    if (webrtcPeer.getPlayer() === multiplayerObject.getOwner()) {
      return;
    }

    // Send reliable message if object is removed
    if (multiplayerObject.isRemoved()) {
      return webrtcPeer.sendReliableUnorderedMessage(dataBuffer);
    }

    // Send reliable message if object must sync
    if (multiplayerObject.mustSyncReliably()) {
      return webrtcPeer.sendReliableOrderedMessage(dataBuffer);
    }

    webrtcPeer.sendUnreliableUnorderedMessage(dataBuffer);
  }

  // Remote
  private createOrSynchronizeObject(
    multiplayerScene: MultiplayerScene,
    entityTypeId: EntityType,
    objectOwnerId: string,
    objectId: string,
    objectData: ArrayBuffer
  ) {
    // Try to find object
    const object = multiplayerScene.getSyncableObject(objectId);

    if (object === null) {
      return this.createObject(
        multiplayerScene,
        entityTypeId,
        objectOwnerId,
        objectId,
        objectData
      );
    }

    object.synchronize(objectData);
  }

  private createObject(
    multiplayerScene: MultiplayerScene,
    entityTypeId: EntityType,
    objectOwnerId: string,
    objectId: string,
    objectData: ArrayBuffer
  ) {
    const objectClass = multiplayerScene.getSyncableObjectClass(entityTypeId);

    if (objectClass === null) {
      return console.warn(`Object class not found for type ${entityTypeId}`);
    }

    // Try to find owner
    const player = this.gameState.getMatch()?.getPlayer(objectOwnerId) ?? null;

    if (player === null) {
      return console.warn("Cannot find player with id", objectOwnerId);
    }

    // Try to create object instance
    let objectInstance: MultiplayerGameEntity;

    try {
      objectInstance = objectClass.deserialize(objectId, objectData);
    } catch (error) {
      return console.warn("Cannot deserialize object with id", objectId, error);
    }

    objectInstance.setOwner(player);
    multiplayerScene?.addObjectToSceneLayer(objectInstance);
    console.log("Added object to scene layer", objectInstance);
  }

  private removeObject(
    multiplayerScene: MultiplayerScene,
    objectId: string
  ): void {
    const object = multiplayerScene.getSyncableObject(objectId);

    if (object === null) {
      return console.warn(`Object not found with id ${objectId}`);
    }

    object.setState(EntityStateType.Inactive);
    object.setRemoved(true);
  }
}
