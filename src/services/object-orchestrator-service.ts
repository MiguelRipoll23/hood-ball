import { GameController } from "../models/game-controller.js";
import { GameFrame } from "../models/game-frame.js";
import type { MultiplayerGameObject } from "../interfaces/objects/multiplayer-game-object.js";
import { WebRTCService } from "./webrtc-service.js";
import { GameState } from "../models/game-state.js";
import type { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { ObjectUtils } from "../utils/object-utils.js";
import type { MultiplayerScreen } from "../interfaces/screen/multiplayer-screen.js";
import { ObjectStateType } from "../enums/object-state-type.js";
import { ScreenUtils } from "../utils/screen-utils.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import { BinaryReader } from "../utils/binary-reader-utils.js";
import { BinaryWriter } from "../utils/binary-writer-utils.js";
import type { ObjectType } from "../enums/object-type.js";
import { PeerCommandHandler } from "../decorators/peer-command-handler-decorator.js";

export class ObjectOrchestrator {
  private readonly PERIODIC_MILLISECONDS = 500;

  private webrtcService: WebRTCService;
  private gameFrame: GameFrame;
  private gameState: GameState;

  private elapsedMilliseconds: number = 0;
  private periodicUpdate: boolean = false;

  constructor(gameController: GameController) {
    this.webrtcService = gameController.getWebRTCService();
    this.gameFrame = gameController.getGameFrame();
    this.gameState = gameController.getGameState();
    this.webrtcService.registerCommandHandlers(this);
  }

  public sendLocalData(
    multiplayerScreen: MultiplayerScreen,
    deltaTimeStamp: number
  ): void {
    if (this.gameState.getMatch() === null) {
      this.elapsedMilliseconds = 0;
      return;
    }

    this.elapsedMilliseconds += deltaTimeStamp;
    this.periodicUpdate =
      this.elapsedMilliseconds >= this.PERIODIC_MILLISECONDS;

    multiplayerScreen.getSyncableObjects().forEach((multiplayerObject) => {
      const mustSync = multiplayerObject.mustSync();
      const mustSyncReliably = multiplayerObject.mustSyncReliably();

      if (mustSync || mustSyncReliably || this.periodicUpdate) {
        this.sendLocalObjectData(multiplayerScreen, multiplayerObject);
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
    if (ObjectUtils.hasInvalidOwner(webrtcPeer, objectOwnerId)) {
      return console.warn(
        "Received object data from unauthorized player",
        objectOwnerId
      );
    }

    // Check for screen
    const objectMultiplayerScreen = ScreenUtils.getScreenById(
      this.gameFrame,
      screenId
    );

    if (objectMultiplayerScreen === null) {
      return console.warn(`Screen not found with id ${screenId}`);
    }

    switch (objectStateId) {
      case ObjectStateType.Active:
        return this.createOrSynchronizeObject(
          objectMultiplayerScreen,
          objectTypeId,
          objectOwnerId,
          objectId,
          objectData
        );

      case ObjectStateType.Inactive:
        return this.removeObject(objectMultiplayerScreen, objectId);

      default:
        console.warn(`Unknown object state: ${objectStateId}`);
    }
  }

  // Local
  private sendLocalObjectData(
    multiplayerScreen: MultiplayerScreen,
    multiplayerObject: MultiplayerGameObject
  ): void {
    this.updateOwnerToSharedObjects(multiplayerObject);

    if (this.skipUnownedObject(multiplayerObject)) {
      return;
    }

    this.markAsRemovedIfObjectInactive(multiplayerObject);

    const arrayBuffer = this.getObjectDataArrayBuffer(
      multiplayerScreen,
      multiplayerObject
    );

    this.webrtcService.getPeers().forEach((webrtcPeer) => {
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

  private updateOwnerToSharedObjects(multiplayerObject: MultiplayerGameObject) {
    const syncableByHost = multiplayerObject.isSyncableByHost();
    const unowned = multiplayerObject.getOwner() === null;

    if (syncableByHost && unowned) {
      const hostPlayer = this.gameState.getMatch()?.getHost() ?? null;
      multiplayerObject.setOwner(hostPlayer);
    }
  }

  private skipUnownedObject(multiplayerObject: MultiplayerGameObject): boolean {
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
    multiplayerObject: MultiplayerGameObject
  ): void {
    if (multiplayerObject.getState() === ObjectStateType.Inactive) {
      multiplayerObject.setRemoved(true);
    }
  }

  private getObjectDataArrayBuffer(
    multiplayerScreen: MultiplayerScreen,
    multiplayerObject: MultiplayerGameObject
  ): ArrayBuffer {
    const screenTypeId = multiplayerScreen.getTypeId();
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
    multiplayerObject: MultiplayerGameObject,
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
    multiplayerScreen: MultiplayerScreen,
    objectTypeId: ObjectType,
    objectOwnerId: string,
    objectId: string,
    objectData: ArrayBuffer
  ) {
    // Try to find object
    const object = multiplayerScreen.getSyncableObject(objectId);

    if (object === null) {
      return this.createObject(
        multiplayerScreen,
        objectTypeId,
        objectOwnerId,
        objectId,
        objectData
      );
    }

    object.synchronize(objectData);
  }

  private createObject(
    multiplayerScreen: MultiplayerScreen,
    objectTypeId: ObjectType,
    objectOwnerId: string,
    objectId: string,
    objectData: ArrayBuffer
  ) {
    const objectClass = multiplayerScreen.getSyncableObjectClass(objectTypeId);

    if (objectClass === null) {
      return console.warn(`Object class not found for type ${objectTypeId}`);
    }

    // Try to find owner
    const player = this.gameState.getMatch()?.getPlayer(objectOwnerId) ?? null;

    if (player === null) {
      return console.warn("Cannot find player with id", objectOwnerId);
    }

    // Try to create object instance
    let objectInstance: MultiplayerGameObject;

    try {
      objectInstance = objectClass.deserialize(objectId, objectData);
    } catch (error) {
      return console.warn("Cannot deserialize object with id", objectId, error);
    }

    objectInstance.setOwner(player);
    multiplayerScreen?.addObjectToSceneLayer(objectInstance);
    console.log("Added object to scene layer", objectInstance);
  }

  private removeObject(
    multiplayerScreen: MultiplayerScreen,
    objectId: string
  ): void {
    const object = multiplayerScreen.getSyncableObject(objectId);

    if (object === null) {
      return console.warn(`Object not found with id ${objectId}`);
    }

    object.setState(ObjectStateType.Inactive);
    object.setRemoved(true);
  }
}
