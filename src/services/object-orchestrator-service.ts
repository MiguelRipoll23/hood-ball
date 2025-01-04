import { GameController } from "../models/game-controller.js";
import { GameFrame } from "../models/game-frame.js";
import { MultiplayerGameObject } from "../interfaces/object/multiplayer-game-object.js";
import { WebRTCService } from "./webrtc-service.js";
import { GameState } from "../models/game-state.js";
import { WebRTCPeer } from "../interfaces/webrtc-peer.js";
import { ObjectUtils } from "../utils/object-utils.js";
import { MultiplayerScreen } from "../interfaces/screen/multiplayer-screen.js";
import { ObjectStateType } from "../enums/object-state-type.js";
import { ScreenUtils } from "../utils/screen-utils.js";
import { WebRTCType } from "../enums/webrtc-type.js";

export class ObjectOrchestrator {
  private readonly PERIODIC_MILLISECONDS = 500;

  private webrtcService: WebRTCService;
  private gameFrame: GameFrame;
  private gameState: GameState;

  private elapsedMilliseconds: number = 0;
  private periodicUpdate: boolean = false;

  constructor(private gameController: GameController) {
    this.webrtcService = gameController.getWebRTCService();
    this.gameFrame = gameController.getGameFrame();
    this.gameState = gameController.getGameState();
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

  public handleObjectData(
    webrtcPeer: WebRTCPeer,
    data: ArrayBuffer | null
  ): void {
    if (data === null) {
      return console.warn("Received null data from peer");
    }

    const dataView = new DataView(data);
    const screenId = dataView.getInt8(0);
    const stateId = dataView.getInt8(1);
    const ownerId = new TextDecoder().decode(new Uint8Array(data, 4, 32));

    // Check for owner
    if (ObjectUtils.hasInvalidOwner(webrtcPeer, ownerId)) {
      return console.warn(
        "Received object data from unauthorized player",
        ownerId
      );
    }

    // Check for screen
    const multiplayerScreen = ScreenUtils.getScreenById(
      this.gameFrame,
      screenId
    );

    if (multiplayerScreen === null) {
      return console.warn(`Screen not found with id ${screenId}`);
    }

    switch (stateId) {
      case ObjectStateType.Active:
        return this.createOrSynchronizeObject(multiplayerScreen, ownerId, data);

      case ObjectStateType.Inactive:
        return this.removeObject(multiplayerScreen, data);

      default:
        console.warn(`Unknown object state: ${stateId}`);
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
    const screenId = multiplayerScreen.getTypeId();
    const stateId = multiplayerObject.getState();
    const layerId = multiplayerScreen?.getObjectLayer(multiplayerObject);
    const typeId = multiplayerObject.getTypeId();
    const ownerId = multiplayerObject.getOwner()?.getId() ?? null;
    const objectId = multiplayerObject.getId();

    if (typeId === null || objectId === null || ownerId === null) {
      throw new Error("Invalid object data for object id " + objectId);
    }

    const serializedData = multiplayerObject.serialize();

    const ownerIdBytes = new TextEncoder().encode(ownerId);
    const objectIdBytes = new TextEncoder().encode(objectId);
    const serializedBytes = new Uint8Array(serializedData);

    // Calculate total buffer size
    const bufferSize =
      5 + // Fixed-length fields (screenId, stateId, layerId, typeId, OBJECT_DATA_ID)
      ownerIdBytes.length +
      objectIdBytes.length +
      serializedBytes.byteLength;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const dataView = new DataView(arrayBuffer);

    // Write fixed-length fields
    let offset = 0;
    dataView.setInt8(offset++, WebRTCType.ObjectData);
    dataView.setInt8(offset++, screenId);
    dataView.setInt8(offset++, stateId);
    dataView.setInt8(offset++, layerId);
    dataView.setInt8(offset++, typeId);

    // Write ownerId
    new Uint8Array(arrayBuffer, offset, ownerIdBytes.length).set(ownerIdBytes);
    offset += ownerIdBytes.length;

    // Write object id
    new Uint8Array(arrayBuffer, offset, objectIdBytes.length).set(
      objectIdBytes
    );
    offset += objectIdBytes.length;

    // Write serialized data
    new Uint8Array(arrayBuffer, offset, serializedBytes.length).set(
      serializedBytes
    );

    return arrayBuffer;
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

    webrtcPeer.sendUnreliableOrderedMessage(dataBuffer);
  }

  // Remote
  private createOrSynchronizeObject(
    multiplayerScreen: MultiplayerScreen,
    ownerId: string,
    data: ArrayBuffer
  ) {
    const objectId = new TextDecoder().decode(new Uint8Array(data, 36, 32));
    const serializedData = data.slice(68);

    // Try to find object
    const object = multiplayerScreen.getSyncableObject(objectId);

    if (object === null) {
      return this.createObject(multiplayerScreen, ownerId, objectId, data);
    }

    object.synchronize(serializedData);
  }

  private createObject(
    multiplayerScreen: MultiplayerScreen,
    ownerId: string,
    objectId: string,
    data: ArrayBuffer
  ) {
    const dataView = new DataView(data);
    const layerId = dataView.getInt8(2);
    const typeId = dataView.getInt8(3);
    const serializedData = data.slice(68);
    const objectClass = multiplayerScreen.getSyncableObjectClass(typeId);

    if (objectClass === null) {
      return console.warn(`Object class not found for type ${typeId}`);
    }

    // Try to find owner
    const player = this.gameState.getMatch()?.getPlayer(ownerId) ?? null;

    if (player === null) {
      return console.warn("Cannot find player with id", ownerId);
    }

    // Try to create object instance
    let objectInstance: MultiplayerGameObject;

    try {
      objectInstance = objectClass.deserialize(objectId, serializedData);
    } catch (error) {
      return console.warn("Cannot deserialize object with id", objectId, error);
    }

    objectInstance.setOwner(player);
    multiplayerScreen?.addObjectToLayer(layerId, objectInstance);
    console.log(`Created object for layer id ${layerId}`, objectInstance);
  }

  private removeObject(
    multiplayerScreen: MultiplayerScreen,
    data: ArrayBuffer
  ): void {
    const objectId = new TextDecoder().decode(new Uint8Array(data, 40, 36));
    const object = multiplayerScreen.getSyncableObject(objectId);

    if (object === null) {
      return console.warn(`Object not found with id ${objectId}`);
    }

    object.setState(ObjectStateType.Inactive);
    object.setRemoved(true);
  }
}
