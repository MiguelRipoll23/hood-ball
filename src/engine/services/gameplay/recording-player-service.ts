import { injectable, inject } from "@needle-di/core";
import type { DeltaRecordingData } from "./recorder-service.js";
import { BinaryReader } from "../../utils/binary-reader-utils.js";
import type { EntitySnapshot } from "../../interfaces/recording/entity-snapshot-interface.js";
import type { EntitySpawnEvent } from "../../interfaces/recording/entity-spawn-event-interface.js";
import type { EntityDespawnEvent } from "../../interfaces/recording/entity-despawn-event-interface.js";
import type { EntityTransformDelta } from "../../interfaces/recording/entity-transform-delta-interface.js";
import type { EntityStateDelta } from "../../interfaces/recording/entity-state-delta-interface.js";
import type { GameEntity } from "../../models/game-entity.js";
import { EntityRegistry } from "../../utils/entity-registry.js";
import { GameState } from "../../models/game-state.js";
import { SceneType } from "../../enums/scene-type.js";
import { container } from "../di-container.js";
import { EventConsumerService } from "./event-consumer-service.js";
import { SceneTransitionService } from "./scene-transition-service.js";
import { TimerManagerService } from "./timer-manager-service.js";
import { EventProcessorService } from "./event-processor-service.js";

export enum PlaybackState {
  Stopped = "stopped",
  Playing = "playing",
  Paused = "paused",
}

export interface RecordingMetadata {
  version: string;
  startTime: number;
  endTime: number;
  totalFrames: number;
  fps: number;
  sceneId: string;
}

@injectable()
export class RecordingPlayerService {
  private recordingData: DeltaRecordingData | null = null;
  private playbackState: PlaybackState = PlaybackState.Stopped;
  private playbackSpeed = 1.0;
  
  // For delta playback
  private currentEntityStates = new Map<string, EntitySnapshot>();
  private spawnedEntities = new Map<string, GameEntity>(); // Track actual spawned entities
  private replayScene: any = null; // Actual game scene for replay
  private previousScene: any = null; // Store previous scene to restore later
  private currentTime = 0;
  private nextSpawnIndex = 0;
  private nextDespawnIndex = 0;
  private nextTransformIndex = 0;
  private nextStateIndex = 0;

  constructor(
    private readonly gameState: GameState = inject(GameState)
  ) {
    console.log("RecordingPlayerService initialized");
  }

  public async loadRecording(file: File): Promise<void> {
    try {
      const buffer = await file.arrayBuffer();
      const reader = BinaryReader.fromArrayBuffer(buffer);

      // Read and validate magic number
      const magic = new TextDecoder().decode(reader.bytes(4));
      if (magic !== "HREC") {
        throw new Error("Invalid recording file format");
      }

      // Read version - expecting 1.0 for delta format
      reader.unsignedInt8(); // versionMajor
      reader.unsignedInt8(); // versionMinor


      // Read metadata
      const startTime = reader.float64();
      const endTime = reader.float64();
      const totalFrames = reader.unsignedInt32();
      const fps = reader.unsignedInt16();
      const sceneId = reader.variableLengthString();

      // Load delta format
      await this.loadDeltaFormat(reader, startTime, endTime, totalFrames, fps, sceneId);

      this.playbackState = PlaybackState.Stopped;

    } catch (error) {
      console.error("Failed to load recording:", error);
      throw error;
    }
  }

  private async loadDeltaFormat(
    reader: BinaryReader,
    startTime: number,
    endTime: number,
    totalFrames: number,
    fps: number,
    sceneId: string
  ): Promise<void> {
    // Read initial snapshot
    const snapshotCount = reader.unsignedInt32();
    const initialSnapshot: EntitySnapshot[] = [];
    for (let i = 0; i < snapshotCount; i++) {
      initialSnapshot.push(this.readEntitySnapshot(reader));
    }

    // Read spawn events
    const spawnCount = reader.unsignedInt32();
    const spawnEvents: EntitySpawnEvent[] = [];
    for (let i = 0; i < spawnCount; i++) {
      const timestamp = reader.float64();
      const id = reader.variableLengthString();
      const type = reader.variableLengthString();
      const x = reader.float32();
      const y = reader.float32();
      const width = reader.float32();
      const height = reader.float32();
      const hasAngle = reader.boolean();
      const angle = hasAngle ? reader.float32() : undefined;
      const properties = this.readProperties(reader);
      spawnEvents.push({ timestamp, id, type, x, y, width, height, angle, properties });
    }

    // Read despawn events
    const despawnCount = reader.unsignedInt32();
    const despawnEvents: EntityDespawnEvent[] = [];
    for (let i = 0; i < despawnCount; i++) {
      const timestamp = reader.float64();
      const id = reader.variableLengthString();
      despawnEvents.push({ timestamp, id });
    }

    // Read transform deltas
    const transformCount = reader.unsignedInt32();
    const transformDeltas: EntityTransformDelta[] = [];
    for (let i = 0; i < transformCount; i++) {
      const timestamp = reader.float64();
      const id = reader.variableLengthString();
      const flags = reader.unsignedInt8();
      
      const delta: EntityTransformDelta = { timestamp, id };
      if (flags & 0x01) delta.x = reader.float32();
      if (flags & 0x02) delta.y = reader.float32();
      if (flags & 0x04) delta.angle = reader.float32();
      if (flags & 0x08) delta.velocityX = reader.float32();
      if (flags & 0x10) delta.velocityY = reader.float32();
      
      transformDeltas.push(delta);
    }

    // Read state deltas
    const stateCount = reader.unsignedInt32();
    const stateDeltas: EntityStateDelta[] = [];
    for (let i = 0; i < stateCount; i++) {
      const timestamp = reader.float64();
      const id = reader.variableLengthString();
      const properties = this.readProperties(reader);
      stateDeltas.push({ timestamp, id, properties });
    }

    // Read events
    const eventCount = reader.unsignedInt32();
    const events = [];
    for (let i = 0; i < eventCount; i++) {
      const type = reader.unsignedInt16();
      const consumed = reader.boolean();
      const dataJson = reader.variableLengthString();
      const data = JSON.parse(dataJson);
      events.push({ type, consumed, data });
    }

    this.recordingData = {
      metadata: {
        version: "1.0",
        startTime,
        endTime,
        totalFrames,
        fps,
        sceneId,
      },
      initialSnapshot,
      spawnEvents,
      despawnEvents,
      transformDeltas,
      stateDeltas,
      events,
    };


  }

  private readEntitySnapshot(reader: BinaryReader): EntitySnapshot {
    const id = reader.variableLengthString();
    const type = reader.variableLengthString();
    const x = reader.float32();
    const y = reader.float32();
    const width = reader.float32();
    const height = reader.float32();
    const hasAngle = reader.boolean();
    const angle = hasAngle ? reader.float32() : undefined;
    const visible = reader.boolean();
    const opacity = reader.float32();
    const hasVelocityX = reader.boolean();
    const velocityX = hasVelocityX ? reader.float32() : undefined;
    const hasVelocityY = reader.boolean();
    const velocityY = hasVelocityY ? reader.float32() : undefined;
    const properties = this.readProperties(reader);
    
    return { id, type, x, y, width, height, angle, visible, opacity, velocityX, velocityY, properties };
  }

  private readProperties(reader: BinaryReader): Record<string, unknown> {
    const propCount = reader.unsignedInt8();
    const properties: Record<string, unknown> = {};
    for (let i = 0; i < propCount; i++) {
      const key = reader.variableLengthString();
      const valueJson = reader.variableLengthString();
      properties[key] = JSON.parse(valueJson);
    }
    return properties;
  }

  public async play(): Promise<void> {
    if (!this.recordingData) {
      console.warn("No recording loaded");
      return;
    }

    if (this.playbackState === PlaybackState.Playing) {
      console.warn("Already playing");
      return;
    }

    // Load the recorded scene
    await this.loadRecordedScene();

    this.playbackState = PlaybackState.Playing;
    this.initializeDeltaPlayback();
    

  }

  private async loadRecordedScene(): Promise<void> {
    if (!this.recordingData) return;

    const sceneId = parseInt(this.recordingData.metadata.sceneId);


    // Store current scene to restore later (DON'T dispose it - we want to restore it)
    this.previousScene = this.gameState.getGameFrame().getCurrentScene();
    
    if (this.previousScene) {

      // Just clear it from GameFrame, but keep the scene intact for restoration
      this.gameState.getGameFrame().setCurrentScene(null as any);
    }

    // Load the actual WorldScene for replay
    if (sceneId === SceneType.World) {
      // Dynamically import WorldScene to avoid circular dependencies
      const { WorldScene } = await import("../../../game/scenes/world/world-scene.js");
      
      // Create WorldScene with all its dependencies in REPLAY MODE
      this.replayScene = new WorldScene(
        this.gameState,
        container.get(EventConsumerService),
        container.get(SceneTransitionService),
        container.get(TimerManagerService),
        // For replay, we pass null/mock services for matchmaking since we don't need them
        null as any, // matchmakingService
        null as any, // matchmakingController
        null as any, // entityOrchestrator
        container.get(EventProcessorService),
        null as any, // spawnPointService
        null as any, // chatService
        null as any, // matchActionsLogService
        true // REPLAY MODE - don't create entities
      );
      
      // Load the scene - it will skip entity creation due to replay mode
      this.replayScene.load();
      

    } else {
      console.warn(`Scene type ${sceneId} not yet supported for replay`);
      return;
    }
    
    // Set as current scene
    this.gameState.getGameFrame().setCurrentScene(this.replayScene);
    

  }

  private initializeDeltaPlayback(): void {
    if (!this.recordingData) return;
    
    // Reset entity states to initial snapshot
    this.currentEntityStates.clear();
    this.spawnedEntities.clear();
    
    // Spawn initial entities
    for (const snapshot of this.recordingData.initialSnapshot) {
      this.currentEntityStates.set(snapshot.id, { ...snapshot });
      this.spawnEntityFromSnapshot(snapshot);
    }
    
    // Reset playback indices
    this.currentTime = 0;
    this.nextSpawnIndex = 0;
    this.nextDespawnIndex = 0;
    this.nextTransformIndex = 0;
    this.nextStateIndex = 0;
    

  }

  private spawnEntityFromSnapshot(snapshot: EntitySnapshot): void {
    // Try to spawn entity via registry
    const entity = EntityRegistry.create(snapshot.type);
    if (!entity) {
      console.warn(`Cannot spawn entity of type "${snapshot.type}" - not registered`);
      return;
    }

    // Set entity state from snapshot
    this.applySnapshotToEntity(entity, snapshot);

    // Load the entity
    entity.load();

    // Add to current scene
    const currentScene = this.gameState.getGameFrame().getCurrentScene();
    if (currentScene) {
      currentScene.addEntityToSceneLayer(entity);
    }

    // Track spawned entity
    this.spawnedEntities.set(snapshot.id, entity);
    

  }

  private applySnapshotToEntity(entity: GameEntity, snapshot: EntitySnapshot): void {
    // Apply position and transform
    const moveable = entity as {
      setX?: (x: number) => void;
      setY?: (y: number) => void;
      setAngle?: (angle: number) => void;
      setWidth?: (width: number) => void;
      setHeight?: (height: number) => void;
      angle?: number; // Direct property access fallback
    };

    if (moveable.setX) moveable.setX(snapshot.x);
    if (moveable.setY) moveable.setY(snapshot.y);
    
    // Apply angle - try setter first, then direct property
    if (snapshot.angle !== undefined) {
      if (moveable.setAngle) {
        moveable.setAngle(snapshot.angle);
      } else if ('angle' in moveable) {
        moveable.angle = snapshot.angle;
      }
    }
    
    if (moveable.setWidth) moveable.setWidth(snapshot.width);
    if (moveable.setHeight) moveable.setHeight(snapshot.height);

    // Apply opacity
    entity.setOpacity(snapshot.opacity);

    // Apply velocities if entity supports it
    if (snapshot.velocityX !== undefined || snapshot.velocityY !== undefined) {
      const dynamic = entity as {
        setVX?: (vx: number) => void;
        setVY?: (vy: number) => void;
      };
      if (snapshot.velocityX !== undefined && dynamic.setVX) {
        dynamic.setVX(snapshot.velocityX);
      }
      if (snapshot.velocityY !== undefined && dynamic.setVY) {
        dynamic.setVY(snapshot.velocityY);
      }
    }

    // Apply any custom properties from the snapshot
    // This applies recorded properties directly to the entity
    const anyEntity = entity as any;
    for (const [key, value] of Object.entries(snapshot.properties)) {
      // Try to set the property if it exists on the entity
      if (key in anyEntity) {
        anyEntity[key] = value;
      }
    }
  }

  public pause(): void {
    if (this.playbackState !== PlaybackState.Playing) {
      console.warn("Not currently playing");
      return;
    }

    this.playbackState = PlaybackState.Paused;

  }

  public stop(): void {
    this.playbackState = PlaybackState.Stopped;
    this.currentTime = 0;
    
    // Clean up spawned entities
    for (const entity of this.spawnedEntities.values()) {
      entity.setRemoved(true);
    }
    this.spawnedEntities.clear();
    
    // Exit replay scene if active
    if (this.replayScene) {

      this.replayScene.dispose();
      this.replayScene = null;
    }
    
    // Restore previous scene
    if (this.previousScene) {

      // Resubscribe events if the scene has that method
      if (typeof this.previousScene.resubscribeEvents === 'function') {
        this.previousScene.resubscribeEvents();
      }
      this.gameState.getGameFrame().setCurrentScene(this.previousScene);
      this.previousScene = null;
    }
    

  }

  public seekToTime(timeMs: number): void {
    if (!this.recordingData) {
      console.warn("No recording loaded");
      return;
    }

    // Reset to initial state and replay up to target time
    this.initializeDeltaPlayback();
    this.currentTime = timeMs;
    
    // Apply all deltas up to this time
    this.applyDeltasUpToTime(timeMs);
  }

  private applyDeltasUpToTime(targetTime: number): void {
    if (!this.recordingData) return;

    // Apply spawn events
    while (
      this.nextSpawnIndex < this.recordingData.spawnEvents.length &&
      this.recordingData.spawnEvents[this.nextSpawnIndex].timestamp <= targetTime
    ) {
      const spawnEvent = this.recordingData.spawnEvents[this.nextSpawnIndex];
      const snapshot: EntitySnapshot = {
        id: spawnEvent.id,
        type: spawnEvent.type,
        x: spawnEvent.x,
        y: spawnEvent.y,
        width: spawnEvent.width,
        height: spawnEvent.height,
        angle: spawnEvent.angle,
        visible: true,
        opacity: 1,
        properties: { ...spawnEvent.properties },
      };
      this.currentEntityStates.set(spawnEvent.id, snapshot);
      
      // Spawn actual entity
      this.spawnEntityFromSnapshot(snapshot);
      
      this.nextSpawnIndex++;
    }

    // Apply despawn events
    while (
      this.nextDespawnIndex < this.recordingData.despawnEvents.length &&
      this.recordingData.despawnEvents[this.nextDespawnIndex].timestamp <= targetTime
    ) {
      const despawnEvent = this.recordingData.despawnEvents[this.nextDespawnIndex];
      this.currentEntityStates.delete(despawnEvent.id);
      
      // Remove actual entity
      const entity = this.spawnedEntities.get(despawnEvent.id);
      if (entity) {
        entity.setRemoved(true);
        this.spawnedEntities.delete(despawnEvent.id);
      }
      
      this.nextDespawnIndex++;
    }

    // Apply transform deltas to both state and actual entities
    while (
      this.nextTransformIndex < this.recordingData.transformDeltas.length &&
      this.recordingData.transformDeltas[this.nextTransformIndex].timestamp <= targetTime
    ) {
      const delta = this.recordingData.transformDeltas[this.nextTransformIndex];
      const entityState = this.currentEntityStates.get(delta.id);
      if (entityState) {
        if (delta.x !== undefined) entityState.x = delta.x;
        if (delta.y !== undefined) entityState.y = delta.y;
        if (delta.angle !== undefined) entityState.angle = delta.angle;
        if (delta.velocityX !== undefined) entityState.velocityX = delta.velocityX;
        if (delta.velocityY !== undefined) entityState.velocityY = delta.velocityY;
        
        // Apply to actual entity
        const entity = this.spawnedEntities.get(delta.id);
        if (entity) {
          this.applySnapshotToEntity(entity, entityState);
        }
      }
      this.nextTransformIndex++;
    }

    // Apply state deltas
    while (
      this.nextStateIndex < this.recordingData.stateDeltas.length &&
      this.recordingData.stateDeltas[this.nextStateIndex].timestamp <= targetTime
    ) {
      const delta = this.recordingData.stateDeltas[this.nextStateIndex];
      const entityState = this.currentEntityStates.get(delta.id);
      if (entityState) {
        Object.assign(entityState.properties, delta.properties);
        
        // Apply to actual entity (would need entity-specific handling)
        // For now, we just update the state
      }
      this.nextStateIndex++;
    }
  }

  public setPlaybackSpeed(speed: number): void {
    if (speed <= 0) {
      console.warn("Playback speed must be positive");
      return;
    }

    this.playbackSpeed = speed;

  }

  public getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  public stepForward(): void {
    // Not implemented for delta format - would need frame concept
    console.warn("Step forward not supported in delta recording format");
  }

  public stepBackward(): void {
    // Not implemented for delta format - would need frame concept
    console.warn("Step backward not supported in delta recording format");
  }

  public update(deltaTimeMs: number): void {
    if (!this.recordingData || this.playbackState !== PlaybackState.Playing) {
      return;
    }

    // Calculate how much time has passed adjusted for playback speed
    const adjustedDelta = deltaTimeMs * this.playbackSpeed;
    this.currentTime += adjustedDelta;

    // Apply deltas up to current time
    this.applyDeltasUpToTime(this.currentTime);

    // Check if playback is finished
    const totalDuration = this.getTotalDurationMs();
    if (this.currentTime >= totalDuration) {
      this.stop();
    }
  }

  public getCurrentEntityStates(): Map<string, EntitySnapshot> {
    return this.currentEntityStates;
  }

  public getCurrentFrameIndex(): number {
    // For delta format, calculate approximate frame index based on time
    if (!this.recordingData) return 0;
    const fps = this.recordingData.metadata.fps || 60;
    return Math.floor((this.currentTime / 1000) * fps);
  }

  public seekToFrame(frameIndex: number): void {
    if (!this.recordingData) {
      console.warn("No recording loaded");
      return;
    }
    
    // Convert frame index to time
    const fps = this.recordingData.metadata.fps || 60;
    const timeMs = (frameIndex / fps) * 1000;
    this.seekToTime(timeMs);
  }

  public getTotalFrames(): number {
    return this.recordingData?.metadata.totalFrames ?? 0;
  }

  public getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  public isLoaded(): boolean {
    return this.recordingData !== null;
  }

  public getRecordingMetadata(): RecordingMetadata | null {
    return this.recordingData?.metadata ?? null;
  }

  public getCurrentTimeMs(): number {
    return this.currentTime;
  }

  public getTotalDurationMs(): number {
    if (!this.recordingData) {
      return 0;
    }
    const metadata = this.recordingData.metadata;
    return metadata.endTime - metadata.startTime;
  }

  public getProgress(): number {
    const totalDuration = this.getTotalDurationMs();
    if (totalDuration === 0) {
      return 0;
    }
    return Math.min(this.currentTime / totalDuration, 1.0);
  }

  public unload(): void {
    this.stop();
    this.recordingData = null;
    this.currentEntityStates.clear();
    console.log("Recording unloaded");
  }
}
