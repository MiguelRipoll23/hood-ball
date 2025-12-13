import { injectable } from "@needle-di/core";
import type { GameEntity } from "../../models/game-entity.js";
import type { GameEvent } from "../../interfaces/models/game-event-interface.js";
import { BaseMoveableGameEntity } from "../../entities/base-moveable-game-entity.js";
import { BinaryWriter } from "../../utils/binary-writer-utils.js";
import type { GameFrame } from "../../models/game-frame.js";
import { container } from "../di-container.js";
import { EventProcessorService } from "./event-processor-service.js";
import type { EntitySnapshot } from "../../interfaces/recording/entity-snapshot-interface.js";
import type { EntitySpawnEvent } from "../../interfaces/recording/entity-spawn-event-interface.js";
import type { EntityDespawnEvent } from "../../interfaces/recording/entity-despawn-event-interface.js";
import type { EntityTransformDelta } from "../../interfaces/recording/entity-transform-delta-interface.js";
import type { EntityStateDelta } from "../../interfaces/recording/entity-state-delta-interface.js";

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

// Maximum number of frames to store (for backwards compatibility)
const MAX_FRAMES = MAX_RECORDING_DURATION_MINUTES * 60 * RECORDING_FPS;

// Estimated bytes per frame for old format (used for size comparison)
const ESTIMATED_BYTES_PER_FRAME = 500;

export interface RecordedFrame {
  timestamp: number;
  entities: SerializedEntity[];
  events: SerializedEvent[];
}

export interface SerializedEntity {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
  properties: Record<string, unknown>;
}

export interface SerializedEvent {
  type: number;
  consumed: boolean;
  data: unknown;
}

export interface RecordingMetadata {
  version: string;
  startTime: number;
  endTime: number;
  totalFrames: number;
  fps: number;
}

export interface RecordingData {
  metadata: RecordingMetadata;
  frames: RecordedFrame[];
}

/**
 * New delta-based recording data structure
 */
export interface DeltaRecordingData {
  metadata: RecordingMetadata;
  initialSnapshot: EntitySnapshot[];
  spawnEvents: EntitySpawnEvent[];
  despawnEvents: EntityDespawnEvent[];
  transformDeltas: EntityTransformDelta[];
  stateDeltas: EntityStateDelta[];
  events: SerializedEvent[];
}

@injectable()
export class RecorderService {
  private recording = false;
  private paused = false;
  private frames: RecordedFrame[] = [];
  private startTime: number = 0;
  private endTime: number = 0;
  private frameCount = 0;
  private autoRecording = false;
  private entityIdCache = new WeakMap<GameEntity, string>();

  // Delta recording data structures
  private initialSnapshot: EntitySnapshot[] = [];
  private spawnEvents: EntitySpawnEvent[] = [];
  private despawnEvents: EntityDespawnEvent[] = [];
  private transformDeltas: EntityTransformDelta[] = [];
  private stateDeltas: EntityStateDelta[] = [];
  private recordedEvents: SerializedEvent[] = [];
  
  // Track entity state for delta detection
  private lastEntityState = new Map<string, {
    x: number;
    y: number;
    angle?: number;
    velocityX?: number;
    velocityY?: number;
    properties: Record<string, unknown>;
  }>();
  
  // Track which entities exist (for spawn/despawn detection)
  private trackedEntities = new Set<string>();

  constructor() {
    console.log("RecorderService initialized");
  }

  public isRecording(): boolean {
    return this.recording;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public startRecording(auto = false): void {
    console.log(`[RecorderService] startRecording called - auto: ${auto}`);
    console.log(
      `[RecorderService] Current state - recording: ${this.recording}, paused: ${this.paused}`
    );

    if (this.recording) {
      console.warn("Recording is already in progress");
      return;
    }

    console.log(`Starting recording${auto ? " (auto)" : ""}...`);
    this.recording = true;
    this.paused = false;
    this.frames = [];
    this.frameCount = 0;
    this.startTime = Date.now();
    this.autoRecording = auto;
    
    // Reset delta recording structures
    this.initialSnapshot = [];
    this.spawnEvents = [];
    this.despawnEvents = [];
    this.transformDeltas = [];
    this.stateDeltas = [];
    this.recordedEvents = [];
    this.lastEntityState.clear();
    this.trackedEntities.clear();

    console.log(
      `[RecorderService] Recording started - recording: ${this.recording}, paused: ${this.paused}`
    );
  }

  public pauseRecording(): void {
    if (!this.recording || this.paused) {
      return;
    }

    console.log("Pausing recording...");
    this.paused = true;
  }

  public resumeRecording(): void {
    if (!this.recording || !this.paused) {
      return;
    }

    console.log("Resuming recording...");
    this.paused = false;
  }

  public stopRecording(): void {
    if (!this.recording) {
      return;
    }

    console.log(`Stopping recording. Total frames: ${this.frameCount}`);
    this.endTime = Date.now();
    this.recording = false;
    this.paused = false;
    this.autoRecording = false;
  }

  public isAutoRecording(): boolean {
    return this.autoRecording;
  }

  public recordFrameFromGameState(gameFrame: GameFrame): void {
    if (!this.recording || this.paused) {
      return;
    }

    // Collect all entities from current scene
    const entities: GameEntity[] = [];
    const currentScene = gameFrame.getCurrentScene();

    if (currentScene) {
      entities.push(...currentScene.getUIEntities());
      entities.push(...currentScene.getWorldEntities());

      // Also collect entities from subscene if it exists
      const subScene = currentScene.getSceneManagerService()?.getCurrentScene();
      if (subScene) {
        entities.push(...subScene.getUIEntities());
        entities.push(...subScene.getWorldEntities());
      }
    }

    // Collect events from event queues
    const events: GameEvent[] = [];
    const eventProcessor = container.get(EventProcessorService);
    const localQueue = eventProcessor.getLocalQueue();
    const remoteQueue = eventProcessor.getRemoteQueue();

    events.push(...localQueue.getEvents());
    events.push(...remoteQueue.getEvents());

    // Record the frame
    this.recordFrame(entities, events);
  }

  public recordFrame(entities: GameEntity[], events: GameEvent[]): void {
    // Log first few calls to verify method is being invoked
    if (this.frameCount < 5 || this.frameCount % 120 === 0) {
      console.log(
        `[RecorderService] recordFrame called - frame: ${this.frameCount}, recording: ${this.recording}, paused: ${this.paused}, entities: ${entities.length}, events: ${events.length}`
      );
    }

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
    
    // Record events
    this.recordEvents(events, timestamp);

    // Also maintain old format for backwards compatibility
    const frame: RecordedFrame = {
      timestamp,
      entities: this.serializeEntities(entities),
      events: this.serializeEvents(events),
    };
    this.frames.push(frame);

    this.frameCount++;

    // Log every 60 frames (once per second at 60fps)
    if (this.frameCount % 60 === 0) {
      console.log(`Recorded ${this.frameCount} frames (${this.transformDeltas.length} transform deltas, ${this.stateDeltas.length} state deltas)`);
    }

    // Remove oldest frame if we exceed the maximum
    if (this.frames.length > MAX_FRAMES) {
      this.frames.shift();
    }
  }

  private captureInitialSnapshot(entities: GameEntity[]): void {
    for (const entity of entities) {
      const snapshot = this.createEntitySnapshot(entity);
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
        properties: { ...snapshot.properties },
      });
    }
    
    console.log(`Initial snapshot captured: ${this.initialSnapshot.length} entities`);
  }

  private createEntitySnapshot(entity: GameEntity): EntitySnapshot {
    const moveable = entity as BaseMoveableGameEntity;
    const dynamic = entity as { vx?: number; vy?: number; getVX?: () => number; getVY?: () => number };
    
    return {
      id: this.getEntityId(entity),
      type: entity.constructor.name,
      x: moveable.getX?.() ?? 0,
      y: moveable.getY?.() ?? 0,
      width: moveable.getWidth?.() ?? 0,
      height: moveable.getHeight?.() ?? 0,
      angle: moveable.getAngle?.(),
      visible: true,
      opacity: entity.getOpacity(),
      velocityX: dynamic.getVX?.() ?? dynamic.vx,
      velocityY: dynamic.getVY?.() ?? dynamic.vy,
      properties: this.extractEntityProperties(entity, moveable),
    };
  }

  private recordSpawnDespawnEvents(entities: GameEntity[], timestamp: number): void {
    const currentEntityIds = new Set<string>();
    
    // Check for spawns
    for (const entity of entities) {
      const id = this.getEntityId(entity);
      currentEntityIds.add(id);
      
      if (!this.trackedEntities.has(id)) {
        // New entity spawned
        const moveable = entity as BaseMoveableGameEntity;
        const dynamic = entity as { vx?: number; vy?: number; getVX?: () => number; getVY?: () => number };
        const spawnEvent: EntitySpawnEvent = {
          timestamp,
          id,
          type: entity.constructor.name,
          x: moveable.getX?.() ?? 0,
          y: moveable.getY?.() ?? 0,
          width: moveable.getWidth?.() ?? 0,
          height: moveable.getHeight?.() ?? 0,
          angle: moveable.getAngle?.(),
          properties: this.extractEntityProperties(entity, moveable),
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
          properties: { ...spawnEvent.properties },
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
      const dynamic = entity as { vx?: number; vy?: number; getVX?: () => number; getVY?: () => number };
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
      
      if (currentAngle !== undefined && lastState.angle !== undefined &&
          Math.abs(currentAngle - lastState.angle) > ANGLE_DELTA_THRESHOLD) {
        transformDelta.angle = currentAngle;
        lastState.angle = currentAngle;
        hasTransformChange = true;
      }
      
      if (currentVx !== undefined && lastState.velocityX !== undefined &&
          Math.abs(currentVx - lastState.velocityX) > VELOCITY_DELTA_THRESHOLD) {
        transformDelta.velocityX = currentVx;
        lastState.velocityX = currentVx;
        hasTransformChange = true;
      }
      
      if (currentVy !== undefined && lastState.velocityY !== undefined &&
          Math.abs(currentVy - lastState.velocityY) > VELOCITY_DELTA_THRESHOLD) {
        transformDelta.velocityY = currentVy;
        lastState.velocityY = currentVy;
        hasTransformChange = true;
      }
      
      if (hasTransformChange) {
        this.transformDeltas.push(transformDelta);
      }
      
      // Check for state property changes
      const currentProperties = this.extractEntityProperties(entity, moveable);
      const changedProperties: Record<string, unknown> = {};
      let hasStateChange = false;
      
      for (const [key, value] of Object.entries(currentProperties)) {
        if (key === 'angle') continue; // Already handled in transform
        
        const lastValue = lastState.properties[key];
        // Use simple equality for primitives, JSON for objects/arrays
        const isChanged = typeof value === 'object' && value !== null
          ? JSON.stringify(value) !== JSON.stringify(lastValue)
          : value !== lastValue;
          
        if (isChanged) {
          changedProperties[key] = value;
          lastState.properties[key] = value;
          hasStateChange = true;
        }
      }
      
      if (hasStateChange) {
        this.stateDeltas.push({
          timestamp,
          id,
          properties: changedProperties,
        });
      }
    }
  }

  private recordEvents(events: GameEvent[], _timestamp: number): void {
    for (const event of events) {
      this.recordedEvents.push({
        type: event.getType(),
        consumed: event.isConsumed(),
        data: event.getData(),
      });
    }
  }

  private serializeEntities(entities: GameEntity[]): SerializedEntity[] {
    return entities.map((entity) => {
      const moveable = entity as BaseMoveableGameEntity;
      const serialized: SerializedEntity = {
        id: this.getEntityId(entity),
        type: entity.constructor.name,
        x: moveable.getX?.() ?? 0,
        y: moveable.getY?.() ?? 0,
        width: moveable.getWidth?.() ?? 0,
        height: moveable.getHeight?.() ?? 0,
        visible: true,
        opacity: entity.getOpacity(),
        properties: this.extractEntityProperties(entity, moveable),
      };

      return serialized;
    });
  }

  private serializeEvents(events: GameEvent[]): SerializedEvent[] {
    return events.map((event) => ({
      type: event.getType(),
      consumed: event.isConsumed(),
      data: event.getData(),
    }));
  }

  private getEntityId(entity: GameEntity): string {
    // Check cache first
    const cachedId = this.entityIdCache.get(entity);
    if (cachedId) return cachedId;

    // Try to get a unique ID from the entity
    const anyEntity = entity as unknown as {
      id?: string;
      getId?: () => string;
    };

    let id: string;
    if (anyEntity.id) {
      id = anyEntity.id;
    } else if (anyEntity.getId) {
      id = anyEntity.getId();
    } else {
      // Generate a stable fallback ID and cache it
      id = `${entity.constructor.name}_${Math.random()
        .toString(36)
        .substring(2, 11)}`;
    }

    // Cache the ID for this entity instance
    this.entityIdCache.set(entity, id);
    return id;
  }

  private extractEntityProperties(
    entity: GameEntity,
    moveable?: BaseMoveableGameEntity
  ): Record<string, unknown> {
    const properties: Record<string, unknown> = {};
    const anyEntity = entity as unknown as Record<string, unknown>;

    // Extract angle from moveable entities using getter
    if (moveable && typeof moveable.getAngle === 'function') {
      properties.angle = moveable.getAngle();
    }

    // Extract common properties that might be useful for replay
    const commonProps = [
      "velocityX",
      "velocityY",
      "rotation",
      "scale",
      "scaleX",
      "scaleY",
      "speed",
      "direction",
      "state",
      "health",
      "score",
    ];

    for (const prop of commonProps) {
      if (anyEntity[prop] !== undefined) {
        properties[prop] = anyEntity[prop];
      }
    }

    return properties;
  }

  public exportRecording(): Blob {
    const writer = BinaryWriter.build(1024 * 1024); // Start with 1MB buffer

    // Write magic number "HREC" (Hood Recording)
    writer.fixedLengthString("HREC", 4);

    // Write version 2.0 for delta format
    writer.unsignedInt8(2);
    writer.unsignedInt8(0);

    const endTimeValue = this.endTime || Date.now();

    // Write metadata
    writer.float64(this.startTime);
    writer.float64(endTimeValue);
    writer.unsignedInt32(this.frameCount);
    writer.unsignedInt16(RECORDING_FPS);

    // Write initial snapshot count
    writer.unsignedInt32(this.initialSnapshot.length);
    for (const snapshot of this.initialSnapshot) {
      this.writeEntitySnapshot(writer, snapshot);
    }

    // Write spawn events
    writer.unsignedInt32(this.spawnEvents.length);
    for (const event of this.spawnEvents) {
      writer.float64(event.timestamp);
      writer.variableLengthString(event.id);
      writer.variableLengthString(event.type);
      writer.float32(event.x);
      writer.float32(event.y);
      writer.float32(event.width);
      writer.float32(event.height);
      writer.boolean(event.angle !== undefined);
      if (event.angle !== undefined) {
        writer.float32(event.angle);
      }
      this.writeProperties(writer, event.properties);
    }

    // Write despawn events
    writer.unsignedInt32(this.despawnEvents.length);
    for (const event of this.despawnEvents) {
      writer.float64(event.timestamp);
      writer.variableLengthString(event.id);
    }

    // Write transform deltas
    writer.unsignedInt32(this.transformDeltas.length);
    for (const delta of this.transformDeltas) {
      writer.float64(delta.timestamp);
      writer.variableLengthString(delta.id);
      
      // Write flags to indicate which fields are present
      let flags = 0;
      if (delta.x !== undefined) flags |= 0x01;
      if (delta.y !== undefined) flags |= 0x02;
      if (delta.angle !== undefined) flags |= 0x04;
      if (delta.velocityX !== undefined) flags |= 0x08;
      if (delta.velocityY !== undefined) flags |= 0x10;
      writer.unsignedInt8(flags);
      
      if (delta.x !== undefined) writer.float32(delta.x);
      if (delta.y !== undefined) writer.float32(delta.y);
      if (delta.angle !== undefined) writer.float32(delta.angle);
      if (delta.velocityX !== undefined) writer.float32(delta.velocityX);
      if (delta.velocityY !== undefined) writer.float32(delta.velocityY);
    }

    // Write state deltas
    writer.unsignedInt32(this.stateDeltas.length);
    for (const delta of this.stateDeltas) {
      writer.float64(delta.timestamp);
      writer.variableLengthString(delta.id);
      this.writeProperties(writer, delta.properties);
    }

    // Write events
    writer.unsignedInt32(this.recordedEvents.length);
    for (const event of this.recordedEvents) {
      writer.unsignedInt16(event.type);
      writer.boolean(event.consumed);
      writer.variableLengthString(JSON.stringify(event.data));
    }

    const buffer = writer.toArrayBuffer();
    const oldSize = this.frames.length * ESTIMATED_BYTES_PER_FRAME;
    const reduction = oldSize > 0 ? ((1 - buffer.byteLength / oldSize) * 100).toFixed(1) : 0;
    console.log(`Recording exported as binary: ${buffer.byteLength} bytes (${reduction}% reduction)`);
    console.log(`  Initial: ${this.initialSnapshot.length} entities`);
    console.log(`  Spawns: ${this.spawnEvents.length}, Despawns: ${this.despawnEvents.length}`);
    console.log(`  Transform deltas: ${this.transformDeltas.length}, State deltas: ${this.stateDeltas.length}`);
    return new Blob([buffer], { type: "application/octet-stream" });
  }

  private writeEntitySnapshot(writer: BinaryWriter, snapshot: EntitySnapshot): void {
    writer.variableLengthString(snapshot.id);
    writer.variableLengthString(snapshot.type);
    writer.float32(snapshot.x);
    writer.float32(snapshot.y);
    writer.float32(snapshot.width);
    writer.float32(snapshot.height);
    writer.boolean(snapshot.angle !== undefined);
    if (snapshot.angle !== undefined) {
      writer.float32(snapshot.angle);
    }
    writer.boolean(snapshot.visible);
    writer.float32(snapshot.opacity);
    writer.boolean(snapshot.velocityX !== undefined);
    if (snapshot.velocityX !== undefined) {
      writer.float32(snapshot.velocityX);
    }
    writer.boolean(snapshot.velocityY !== undefined);
    if (snapshot.velocityY !== undefined) {
      writer.float32(snapshot.velocityY);
    }
    this.writeProperties(writer, snapshot.properties);
  }

  private writeProperties(writer: BinaryWriter, properties: Record<string, unknown>): void {
    const propEntries = Object.entries(properties);
    writer.unsignedInt8(propEntries.length);
    for (const [key, value] of propEntries) {
      writer.variableLengthString(key);
      writer.variableLengthString(JSON.stringify(value));
    }
  }

  public downloadRecording(filename?: string): void {
    const blob = this.exportRecording();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `recording_${new Date().toISOString()}.hrec`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`Recording downloaded as ${a.download}`);
  }

  public clearRecording(): void {
    this.frames = [];
    this.frameCount = 0;
    this.endTime = 0;
    this.entityIdCache = new WeakMap<GameEntity, string>();
    
    // Clear delta recording structures
    this.initialSnapshot = [];
    this.spawnEvents = [];
    this.despawnEvents = [];
    this.transformDeltas = [];
    this.stateDeltas = [];
    this.recordedEvents = [];
    this.lastEntityState.clear();
    this.trackedEntities.clear();
    
    console.log("Recording cleared");
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
