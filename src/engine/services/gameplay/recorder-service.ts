import { injectable } from "@needle-di/core";
import type { GameEntity } from "../../models/game-entity.js";
import { BaseMoveableGameEntity } from "../../entities/base-moveable-game-entity.js";
import { BinaryWriter } from "../../utils/binary-writer-utils.js";
import type { GameFrame } from "../../models/game-frame.js";
import type { EntitySnapshot } from "../../interfaces/recording/entity-snapshot-interface.js";
import type { EntitySpawnEvent } from "../../interfaces/recording/entity-spawn-event-interface.js";
import type { EntityDespawnEvent } from "../../interfaces/recording/entity-despawn-event-interface.js";
import type { EntityTransformDelta } from "../../interfaces/recording/entity-transform-delta-interface.js";
import type { EntityStateDelta } from "../../interfaces/recording/entity-state-delta-interface.js";
import { LayerType } from "../../enums/layer-type.js";
import { SceneType } from "../../../game/enums/scene-type.js";

// Maximum recording duration in minutes
const MAX_RECORDING_DURATION_MINUTES = 15;

// Target framerate for recording (assuming 60 FPS)
const RECORDING_FPS = 60;

// Position delta threshold (in pixels)
const POSITION_DELTA_THRESHOLD = 0.5;

// Angle delta threshold (in radians)
const ANGLE_DELTA_THRESHOLD = 0.01;

// Velocity delta threshold
const VELOCITY_DELTA_THRESHOLD = 0.01;

export interface RecordingMetadata {
  version: string;
  startTime: number;
  endTime: number;
  totalFrames: number;
  fps: number;
  sceneId: number; // SceneType enum value of the gameplay scene that was recorded
}

/**
 * Delta-based recording data structure
 */
export interface DeltaRecordingData {
  metadata: RecordingMetadata;
  initialSnapshot: EntitySnapshot[];
  spawnEvents: EntitySpawnEvent[];
  despawnEvents: EntityDespawnEvent[];
  transformDeltas: EntityTransformDelta[];
  stateDeltas: EntityStateDelta[];
}

@injectable()
export class RecorderService {
  private recording = false;
  private paused = false;
  private startTime: number = 0;
  private endTime: number = 0;
  private frameCount = 0;
  private autoRecording = false;
  private entityIdCache = new WeakMap<GameEntity, string>();
  private recordedSceneId: SceneType = SceneType.Unknown;

  // Delta recording data structures
  private initialSnapshot: EntitySnapshot[] = [];
  private spawnEvents: EntitySpawnEvent[] = [];
  private despawnEvents: EntityDespawnEvent[] = [];
  private transformDeltas: EntityTransformDelta[] = [];
  private stateDeltas: EntityStateDelta[] = [];

  // Track entity state for delta detection
  private lastEntityState = new Map<
    string,
    {
      x: number;
      y: number;
      angle?: number;
      velocityX?: number;
      velocityY?: number;
      serializedData?: ArrayBuffer;
    }
  >();

  // Track which entities exist (for spawn/despawn detection)
  private trackedEntities = new Set<string>();

  constructor() {
    console.log("RecorderService initialized");
  }

  /**
   * Clones an ArrayBuffer to prevent mutation issues
   */
  private cloneArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
    const cloned = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(cloned).set(new Uint8Array(buffer));
    return cloned;
  }

  // Entity type mapper injected from game layer
  private entityTypeMapper?: (entity: GameEntity) => number | null;

  /**
   * Sets the entity type mapper function.
   * This allows the game layer to provide entity type mapping logic
   * without creating dependencies from engine to game.
   */
  public setEntityTypeMapper(
    mapper: (entity: GameEntity) => number | null
  ): void {
    this.entityTypeMapper = mapper;
  }

  /**
   * Gets the entity type ID using the injected mapper.
   * Returns null if no mapper is set or entity type is unknown.
   */
  private getEntityTypeId(entity: GameEntity): number | null {
    if (!this.entityTypeMapper) {
      console.warn(
        "No entity type mapper set. Call setEntityTypeMapper() before recording."
      );
      return null;
    }
    return this.entityTypeMapper(entity);
  }

  /**
   * Efficiently compares two ArrayBuffers for equality.
   * Uses 32-bit comparison for better performance on aligned data.
   */
  private areBuffersEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
    if (a.byteLength !== b.byteLength) return false;

    const view1 = new Uint8Array(a);
    const view2 = new Uint8Array(b);
    const len = view1.length;

    // Compare in 4-byte chunks for better performance (when aligned)
    const chunks = Math.floor(len / 4);
    const view1_32 = new Uint32Array(a, 0, chunks);
    const view2_32 = new Uint32Array(b, 0, chunks);

    for (let i = 0; i < chunks; i++) {
      if (view1_32[i] !== view2_32[i]) return false;
    }

    // Compare remaining bytes
    for (let i = chunks * 4; i < len; i++) {
      if (view1[i] !== view2[i]) return false;
    }

    return true;
  }

  public isRecording(): boolean {
    return this.recording;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public startRecording(auto = false): void {
    if (this.recording) {
      console.warn("Recording is already in progress");
      return;
    }

    this.recording = true;
    this.paused = false;
    this.frameCount = 0;
    this.startTime = Date.now();
    this.autoRecording = auto;
    this.recordedSceneId = SceneType.Unknown;

    // Reset delta recording structures
    this.initialSnapshot = [];
    this.spawnEvents = [];
    this.despawnEvents = [];
    this.transformDeltas = [];
    this.stateDeltas = [];
    this.lastEntityState.clear();
    this.trackedEntities.clear();
    this.entityLayerMap = new WeakMap<GameEntity, LayerType>();
  }

  public pauseRecording(): void {
    if (!this.recording || this.paused) {
      return;
    }

    this.paused = true;
  }

  public resumeRecording(): void {
    if (!this.recording || !this.paused) {
      return;
    }

    this.paused = false;
  }

  public stopRecording(): void {
    if (!this.recording) {
      return;
    }

    this.endTime = Date.now();
    this.recording = false;
    this.paused = false;
    this.autoRecording = false;
  }

  public isAutoRecording(): boolean {
    return this.autoRecording;
  }

  // Map to track which layer each entity belongs to
  private entityLayerMap = new WeakMap<GameEntity, LayerType>();

  public recordFrameFromGameState(gameFrame: GameFrame): void {
    if (!this.recording || this.paused) {
      return;
    }

    // Collect all entities from current scene with layer information
    const entities: GameEntity[] = [];
    const currentScene = gameFrame.getCurrentScene();

    if (currentScene) {
      // Capture scene ID on first frame
      if (this.frameCount === 0) {
        this.recordedSceneId = currentScene.getTypeId();

        if (this.recordedSceneId === SceneType.Unknown) {
          return; // Do not record if scene type is unknown
        }
      }

      // Collect UI entities and track their layer
      const uiEntities = currentScene.getUIEntities();
      for (const entity of uiEntities) {
        this.entityLayerMap.set(entity, LayerType.UI);
        entities.push(entity);
      }

      // Collect world entities and track their layer
      const worldEntities = currentScene.getWorldEntities();
      for (const entity of worldEntities) {
        this.entityLayerMap.set(entity, LayerType.Scene);
        entities.push(entity);
      }

      // Also collect entities from subscene if it exists
      const subScene = currentScene.getSceneManagerService()?.getCurrentScene();
      if (subScene) {
        const subUIEntities = subScene.getUIEntities();
        for (const entity of subUIEntities) {
          this.entityLayerMap.set(entity, LayerType.UI);
          entities.push(entity);
        }

        const subWorldEntities = subScene.getWorldEntities();
        for (const entity of subWorldEntities) {
          this.entityLayerMap.set(entity, LayerType.Scene);
          entities.push(entity);
        }
      }
    }

    // Record the frame
    this.recordFrame(entities);
  }

  public recordFrame(entities: GameEntity[]): void {
    if (!this.recording || this.paused) {
      return;
    }

    const timestamp = Date.now() - this.startTime;

    // On first frame, capture initial snapshot of all entities
    if (this.frameCount === 0) {
      this.captureInitialSnapshot(entities);
    }

    // Detect and record spawn/despawn events
    this.recordSpawnDespawnEvents(entities, timestamp);

    // Record transform and state deltas
    this.recordDeltas(entities, timestamp);

    this.frameCount++;
  }

  private captureInitialSnapshot(entities: GameEntity[]): void {
    for (const entity of entities) {
      const snapshot = this.createEntitySnapshot(entity);
      if (snapshot === null) {
        continue; // Skip entities with unknown types
      }
      this.initialSnapshot.push(snapshot);

      // Initialize tracking
      const id = this.getEntityId(entity);
      this.trackedEntities.add(id);
      this.lastEntityState.set(id, {
        x: snapshot.x,
        y: snapshot.y,
        angle: snapshot.angle,
        velocityX: snapshot.velocityX,
        velocityY: snapshot.velocityY,
        serializedData: snapshot.serializedData
          ? this.cloneArrayBuffer(snapshot.serializedData)
          : undefined,
      });
    }
  }

  private createEntitySnapshot(entity: GameEntity): EntitySnapshot | null {
    const moveable = entity as BaseMoveableGameEntity;
    const dynamic = entity as {
      vx?: number;
      vy?: number;
      getVX?: () => number;
      getVY?: () => number;
    };

    // Get entity type - skip if unknown
    const type = entity.getTypeId();

    if (type === null) {
      return null;
    }

    // Get replay state from entity - returns null if entity doesn't implement it
    const serializedData = entity.getReplayState();

    // Get layer from entity layer map (defaults to Scene if not found)
    const layer = this.entityLayerMap.get(entity) ?? LayerType.Scene;

    return {
      id: this.getEntityId(entity),
      type,
      layer,
      x: moveable.getX?.() ?? 0,
      y: moveable.getY?.() ?? 0,
      width: moveable.getWidth?.() ?? 0,
      height: moveable.getHeight?.() ?? 0,
      angle: moveable.getAngle?.(),
      visible: true,
      opacity: entity.getOpacity(),
      velocityX: dynamic.getVX?.() ?? dynamic.vx,
      velocityY: dynamic.getVY?.() ?? dynamic.vy,
      serializedData: serializedData
        ? this.cloneArrayBuffer(serializedData)
        : undefined, // Clone to prevent mutation
    };
  }

  private recordSpawnDespawnEvents(
    entities: GameEntity[],
    timestamp: number
  ): void {
    const currentEntityIds = new Set<string>();

    // Check for spawns
    for (const entity of entities) {
      const id = this.getEntityId(entity);
      currentEntityIds.add(id);

      if (!this.trackedEntities.has(id)) {
        // New entity spawned
        const moveable = entity as BaseMoveableGameEntity;
        const dynamic = entity as {
          vx?: number;
          vy?: number;
          getVX?: () => number;
          getVY?: () => number;
        };

        // Get entity type - skip if unknown
        const type = this.getEntityTypeId(entity);
        if (type === null) {
          continue; // Skip entities with unknown types
        }

        const serializedData = entity.getReplayState();

        // Get layer from entity layer map (defaults to Scene if not found)
        const layer = this.entityLayerMap.get(entity) ?? LayerType.Scene;

        // Clone serializedData if present (ArrayBuffer or object)
        let clonedSerializedData: ArrayBuffer | undefined = undefined;
        if (serializedData instanceof ArrayBuffer) {
          clonedSerializedData = this.cloneArrayBuffer(serializedData);
        } else if (serializedData && typeof structuredClone === "function") {
          // For plain objects, use structuredClone if available
          clonedSerializedData = structuredClone(serializedData);
        } else if (serializedData) {
          // Fallback: shallow copy (not ideal, but better than reference)
          clonedSerializedData = JSON.parse(JSON.stringify(serializedData));
        }

        const spawnEvent: EntitySpawnEvent = {
          timestamp,
          id,
          type,
          layer,
          x: moveable.getX?.() ?? 0,
          y: moveable.getY?.() ?? 0,
          width: moveable.getWidth?.() ?? 0,
          height: moveable.getHeight?.() ?? 0,
          angle: moveable.getAngle?.(),
          serializedData: clonedSerializedData ?? undefined,
        };
        this.spawnEvents.push(spawnEvent);
        this.trackedEntities.add(id);

        // Initialize state tracking
        this.lastEntityState.set(id, {
          x: spawnEvent.x,
          y: spawnEvent.y,
          angle: spawnEvent.angle,
          velocityX: dynamic.getVX?.() ?? dynamic.vx,
          velocityY: dynamic.getVY?.() ?? dynamic.vy,
          serializedData: clonedSerializedData,
        });
      }
    }

    // Check for despawns
    for (const id of this.trackedEntities) {
      if (!currentEntityIds.has(id)) {
        const despawnEvent: EntityDespawnEvent = {
          timestamp,
          id,
        };
        this.despawnEvents.push(despawnEvent);
        this.trackedEntities.delete(id);
        this.lastEntityState.delete(id);
      }
    }
  }

  private recordDeltas(entities: GameEntity[], timestamp: number): void {
    for (const entity of entities) {
      const id = this.getEntityId(entity);
      const lastState = this.lastEntityState.get(id);

      if (!lastState) {
        continue; // Entity not tracked yet
      }

      const moveable = entity as BaseMoveableGameEntity;
      const dynamic = entity as {
        vx?: number;
        vy?: number;
        getVX?: () => number;
        getVY?: () => number;
      };
      const currentX = moveable.getX?.() ?? 0;
      const currentY = moveable.getY?.() ?? 0;
      const currentAngle = moveable.getAngle?.();
      const currentVx = dynamic.getVX?.() ?? dynamic.vx;
      const currentVy = dynamic.getVY?.() ?? dynamic.vy;

      // Check for transform changes
      const transformDelta: EntityTransformDelta = { timestamp, id };
      let hasTransformChange = false;

      if (Math.abs(currentX - lastState.x) > POSITION_DELTA_THRESHOLD) {
        transformDelta.x = currentX;
        lastState.x = currentX;
        hasTransformChange = true;
      }

      if (Math.abs(currentY - lastState.y) > POSITION_DELTA_THRESHOLD) {
        transformDelta.y = currentY;
        lastState.y = currentY;
        hasTransformChange = true;
      }

      if (
        currentAngle !== undefined &&
        lastState.angle !== undefined &&
        Math.abs(currentAngle - lastState.angle) > ANGLE_DELTA_THRESHOLD
      ) {
        transformDelta.angle = currentAngle;
        lastState.angle = currentAngle;
        hasTransformChange = true;
      }

      if (
        currentVx !== undefined &&
        lastState.velocityX !== undefined &&
        Math.abs(currentVx - lastState.velocityX) > VELOCITY_DELTA_THRESHOLD
      ) {
        transformDelta.velocityX = currentVx;
        lastState.velocityX = currentVx;
        hasTransformChange = true;
      }

      if (
        currentVy !== undefined &&
        lastState.velocityY !== undefined &&
        Math.abs(currentVy - lastState.velocityY) > VELOCITY_DELTA_THRESHOLD
      ) {
        transformDelta.velocityY = currentVy;
        lastState.velocityY = currentVy;
        hasTransformChange = true;
      }

      if (hasTransformChange) {
        this.transformDeltas.push(transformDelta);
      }

      // Check for entity-specific state changes using getReplayState()
      const serializedData = entity.getReplayState();
      if (serializedData !== null) {
        // Entity implements custom serialization - check if state changed
        const lastSerializedData = lastState.serializedData;

        // Compare serialized data to detect changes (optimized for small/medium buffers)
        const hasStateChange =
          !lastSerializedData ||
          lastSerializedData.byteLength !== serializedData.byteLength ||
          !this.areBuffersEqual(lastSerializedData, serializedData);

        if (hasStateChange) {
          // Clone to prevent mutation issues
          const clonedData = this.cloneArrayBuffer(serializedData);
          this.stateDeltas.push({
            timestamp,
            id,
            serializedData: clonedData,
          });
          lastState.serializedData = clonedData;
        }
      }
    }
  }

  private getEntityId(entity: GameEntity): string {
    // Check cache first
    const cachedId = this.entityIdCache.get(entity);
    if (cachedId) return cachedId;

    // Use entity's getId() method (always returns a string via BaseGameEntity)
    const id = entity.getId();

    // Cache the ID for this entity instance
    this.entityIdCache.set(entity, id);
    return id;
  }

  public exportRecording(): Blob {
    const binaryWriter = BinaryWriter.build(1024 * 1024); // Start with 1MB buffer

    // Write magic number "HREC" (Hood Recording)
    binaryWriter.fixedLengthString("HREC", 4);

    // Write version 1.0 for delta format
    binaryWriter.unsignedInt8(1);
    binaryWriter.unsignedInt8(0);

    const endTimeValue = this.endTime || Date.now();

    // Write metadata
    binaryWriter.float64(this.startTime);
    binaryWriter.float64(endTimeValue);
    binaryWriter.unsignedInt32(this.frameCount);
    binaryWriter.unsignedInt16(RECORDING_FPS);
    binaryWriter.unsignedInt8(this.recordedSceneId);

    // Write initial snapshot count
    binaryWriter.unsignedInt32(this.initialSnapshot.length);
    for (const snapshot of this.initialSnapshot) {
      this.writeEntitySnapshot(binaryWriter, snapshot);
    }

    // Write spawn events
    binaryWriter.unsignedInt32(this.spawnEvents.length);
    for (const event of this.spawnEvents) {
      binaryWriter.float64(event.timestamp);
      binaryWriter.variableLengthString(event.id);
      binaryWriter.signedInt16(event.type);
      binaryWriter.unsignedInt8(event.layer); // Write layer type (0 = UI, 1 = Scene)
      binaryWriter.float32(event.x);
      binaryWriter.float32(event.y);
      binaryWriter.float32(event.width);
      binaryWriter.float32(event.height);
      binaryWriter.boolean(event.angle !== undefined);
      if (event.angle !== undefined) {
        binaryWriter.float32(event.angle);
      }
      // Write serialized data if available
      binaryWriter.boolean(event.serializedData !== undefined);
      if (event.serializedData) {
        const dataView = new Uint8Array(event.serializedData);
        binaryWriter.unsignedInt32(dataView.length);
        for (let i = 0; i < dataView.length; i++) {
          binaryWriter.unsignedInt8(dataView[i]);
        }
      }
    }

    // Write despawn events
    binaryWriter.unsignedInt32(this.despawnEvents.length);
    for (const event of this.despawnEvents) {
      binaryWriter.float64(event.timestamp);
      binaryWriter.variableLengthString(event.id);
    }

    // Write transform deltas
    binaryWriter.unsignedInt32(this.transformDeltas.length);
    for (const delta of this.transformDeltas) {
      binaryWriter.float64(delta.timestamp);
      binaryWriter.variableLengthString(delta.id);

      // Write flags to indicate which fields are present
      let flags = 0;
      if (delta.x !== undefined) flags |= 0x01;
      if (delta.y !== undefined) flags |= 0x02;
      if (delta.angle !== undefined) flags |= 0x04;
      if (delta.velocityX !== undefined) flags |= 0x08;
      if (delta.velocityY !== undefined) flags |= 0x10;
      binaryWriter.unsignedInt8(flags);

      if (delta.x !== undefined) binaryWriter.float32(delta.x);
      if (delta.y !== undefined) binaryWriter.float32(delta.y);
      if (delta.angle !== undefined) binaryWriter.float32(delta.angle);
      if (delta.velocityX !== undefined) binaryWriter.float32(delta.velocityX);
      if (delta.velocityY !== undefined) binaryWriter.float32(delta.velocityY);
    }

    // Write state deltas
    binaryWriter.unsignedInt32(this.stateDeltas.length);
    for (const delta of this.stateDeltas) {
      binaryWriter.float64(delta.timestamp);
      binaryWriter.variableLengthString(delta.id);
      // Write serialized data
      const dataView = new Uint8Array(delta.serializedData);
      binaryWriter.unsignedInt32(dataView.length);
      for (let i = 0; i < dataView.length; i++) {
        binaryWriter.unsignedInt8(dataView[i]);
      }
    }

    const buffer = binaryWriter.toArrayBuffer();
    return new Blob([buffer], { type: "application/octet-stream" });
  }

  private writeEntitySnapshot(
    binaryWriter: BinaryWriter,
    snapshot: EntitySnapshot
  ): void {
    binaryWriter.variableLengthString(snapshot.id);
    binaryWriter.signedInt16(snapshot.type);
    binaryWriter.unsignedInt8(snapshot.layer); // Write layer type (0 = UI, 1 = Scene)
    binaryWriter.float32(snapshot.x);
    binaryWriter.float32(snapshot.y);
    binaryWriter.float32(snapshot.width);
    binaryWriter.float32(snapshot.height);
    binaryWriter.boolean(snapshot.angle !== undefined);
    if (snapshot.angle !== undefined) {
      binaryWriter.float32(snapshot.angle);
    }
    binaryWriter.boolean(snapshot.visible);
    binaryWriter.float32(snapshot.opacity);
    binaryWriter.boolean(snapshot.velocityX !== undefined);
    if (snapshot.velocityX !== undefined) {
      binaryWriter.float32(snapshot.velocityX);
    }
    binaryWriter.boolean(snapshot.velocityY !== undefined);
    if (snapshot.velocityY !== undefined) {
      binaryWriter.float32(snapshot.velocityY);
    }

    // Write serialized data if available (from entity's getReplayState() method)
    binaryWriter.boolean(snapshot.serializedData !== undefined);
    if (snapshot.serializedData) {
      const dataView = new Uint8Array(snapshot.serializedData);
      binaryWriter.unsignedInt32(dataView.length);
      for (let i = 0; i < dataView.length; i++) {
        binaryWriter.unsignedInt8(dataView[i]);
      }
    }
  }

  public downloadRecording(filename?: string): void {
    const blob = this.exportRecording();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `recording_${new Date().toISOString()}.rec`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public clearRecording(): void {
    this.frameCount = 0;
    this.endTime = 0;
    this.recordedSceneId = SceneType.Unknown;
    this.entityIdCache = new WeakMap<GameEntity, string>();

    // Clear delta recording structures
    this.initialSnapshot = [];
    this.spawnEvents = [];
    this.despawnEvents = [];
    this.transformDeltas = [];
    this.stateDeltas = [];
    this.lastEntityState.clear();
    this.trackedEntities.clear();
    this.entityLayerMap = new WeakMap<GameEntity, LayerType>();
  }

  public getFrameCount(): number {
    return this.frameCount;
  }

  public getRecordingDuration(): number {
    if (!this.startTime) return 0;
    if (this.recording) return Date.now() - this.startTime;
    if (this.endTime) return this.endTime - this.startTime;
    return 0;
  }

  public getMaxDurationMinutes(): number {
    return MAX_RECORDING_DURATION_MINUTES;
  }
}
