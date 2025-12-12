import { injectable } from "@needle-di/core";
import type { GameEntity } from "../../models/game-entity.js";
import type { GameEvent } from "../../interfaces/models/game-event-interface.js";
import { BaseMoveableGameEntity } from "../../entities/base-moveable-game-entity.js";
import { BinaryWriter } from "../../utils/binary-writer-utils.js";
import type { GameFrame } from "../../models/game-frame.js";
import { container } from "../di-container.js";
import { EventProcessorService } from "./event-processor-service.js";
import { isSerializableEntity } from "../../interfaces/entities/serializable-entity-interface.js";

// Maximum recording duration in minutes
const MAX_RECORDING_DURATION_MINUTES = 15;

// Target framerate for recording (assuming 60 FPS)
const RECORDING_FPS = 60;

// Maximum number of frames to store
const MAX_FRAMES = MAX_RECORDING_DURATION_MINUTES * 60 * RECORDING_FPS;

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

    const frame: RecordedFrame = {
      timestamp: Date.now() - this.startTime,
      entities: this.serializeEntities(entities),
      events: this.serializeEvents(events),
    };

    this.frames.push(frame);
    this.frameCount++;

    // Log every 60 frames (once per second at 60fps)
    if (this.frameCount % 60 === 0) {
      console.log(`Recorded ${this.frameCount} frames`);
    }

    // Remove oldest frame if we exceed the maximum
    if (this.frames.length > MAX_FRAMES) {
      this.frames.shift();
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
    // If entity implements SerializableEntity, use its custom serialization
    if (isSerializableEntity(entity)) {
      return entity.serializeForRecording();
    }

    // Fallback to legacy property extraction for entities that don't implement the interface
    const properties: Record<string, unknown> = {};
    const anyEntity = entity as unknown as Record<string, unknown>;

    // Extract angle from moveable entities using getter
    if (moveable) {
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

    // Write version
    writer.unsignedInt8(1);
    writer.unsignedInt8(0);

    // Use actual written frames count for metadata
    const writtenFrames = this.frames.length;
    const endTimeValue = this.endTime || Date.now();

    // Write metadata
    writer.float64(this.startTime);
    writer.float64(endTimeValue);
    writer.unsignedInt32(writtenFrames);
    writer.unsignedInt16(RECORDING_FPS);

    // Write frame count
    writer.unsignedInt32(writtenFrames);

    // Write each frame
    for (const frame of this.frames) {
      // Frame timestamp
      writer.float64(frame.timestamp);

      // Write entities count and data
      writer.unsignedInt16(frame.entities.length);
      for (const entity of frame.entities) {
        writer.variableLengthString(entity.id);
        writer.variableLengthString(entity.type);
        writer.float32(entity.x);
        writer.float32(entity.y);
        writer.float32(entity.width);
        writer.float32(entity.height);
        writer.boolean(entity.visible);
        writer.float32(entity.opacity);

        // Write properties
        const propEntries = Object.entries(entity.properties);
        writer.unsignedInt8(propEntries.length);
        for (const [key, value] of propEntries) {
          writer.variableLengthString(key);
          // Store value as JSON string for flexibility
          writer.variableLengthString(JSON.stringify(value));
        }
      }

      // Write events count and data
      writer.unsignedInt16(frame.events.length);
      for (const event of frame.events) {
        writer.unsignedInt16(event.type);
        writer.boolean(event.consumed);
        // Store event data as JSON string
        writer.variableLengthString(JSON.stringify(event.data));
      }
    }

    const buffer = writer.toArrayBuffer();
    console.log(`Recording exported as binary: ${buffer.byteLength} bytes`);
    return new Blob([buffer], { type: "application/octet-stream" });
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
