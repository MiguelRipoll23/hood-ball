import { injectable } from "@needle-di/core";
import type { DeltaRecordingData } from "./recorder-service.js";
import { BinaryReader } from "../../utils/binary-reader-utils.js";
import type { EntitySnapshot } from "../../interfaces/recording/entity-snapshot-interface.js";
import type { EntitySpawnEvent } from "../../interfaces/recording/entity-spawn-event-interface.js";
import type { EntityDespawnEvent } from "../../interfaces/recording/entity-despawn-event-interface.js";
import type { EntityTransformDelta } from "../../interfaces/recording/entity-transform-delta-interface.js";
import type { EntityStateDelta } from "../../interfaces/recording/entity-state-delta-interface.js";

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
}

@injectable()
export class RecordingPlayerService {
  private recordingData: DeltaRecordingData | null = null;
  private playbackState: PlaybackState = PlaybackState.Stopped;
  private playbackSpeed = 1.0;
  
  // For delta playback
  private currentEntityStates = new Map<string, EntitySnapshot>();
  private currentTime = 0;
  private nextSpawnIndex = 0;
  private nextDespawnIndex = 0;
  private nextTransformIndex = 0;
  private nextStateIndex = 0;

  constructor() {
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
      const versionMajor = reader.unsignedInt8();
      const versionMinor = reader.unsignedInt8();
      console.log(`Recording version: ${versionMajor}.${versionMinor}`);

      // Read metadata
      const startTime = reader.float64();
      const endTime = reader.float64();
      const totalFrames = reader.unsignedInt32();
      const fps = reader.unsignedInt16();

      // Load delta format
      await this.loadDeltaFormat(reader, startTime, endTime, totalFrames, fps);

      this.playbackState = PlaybackState.Stopped;
      console.log(`Recording loaded: ${totalFrames} frames, ${fps} FPS`);
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
    fps: number
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
      },
      initialSnapshot,
      spawnEvents,
      despawnEvents,
      transformDeltas,
      stateDeltas,
      events,
    };

    console.log(`Delta recording loaded:`);
    console.log(`  Initial: ${initialSnapshot.length} entities`);
    console.log(`  Spawns: ${spawnEvents.length}, Despawns: ${despawnEvents.length}`);
    console.log(`  Transform deltas: ${transformDeltas.length}, State deltas: ${stateDeltas.length}`);
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

  public play(): void {
    if (!this.recordingData) {
      console.warn("No recording loaded");
      return;
    }

    if (this.playbackState === PlaybackState.Playing) {
      console.warn("Already playing");
      return;
    }

    this.playbackState = PlaybackState.Playing;
    this.initializeDeltaPlayback();
    
    console.log("Playback started");
  }

  private initializeDeltaPlayback(): void {
    if (!this.recordingData) return;
    
    // Reset entity states to initial snapshot
    this.currentEntityStates.clear();
    for (const snapshot of this.recordingData.initialSnapshot) {
      this.currentEntityStates.set(snapshot.id, { ...snapshot });
    }
    
    // Reset playback indices
    this.currentTime = 0;
    this.nextSpawnIndex = 0;
    this.nextDespawnIndex = 0;
    this.nextTransformIndex = 0;
    this.nextStateIndex = 0;
    
    console.log(`Delta playback initialized with ${this.currentEntityStates.size} entities`);
  }

  public pause(): void {
    if (this.playbackState !== PlaybackState.Playing) {
      console.warn("Not currently playing");
      return;
    }

    this.playbackState = PlaybackState.Paused;
    console.log("Playback paused");
  }

  public stop(): void {
    this.playbackState = PlaybackState.Stopped;
    this.currentTime = 0;
    console.log("Playback stopped");
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
      this.currentEntityStates.set(spawnEvent.id, {
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
      });
      this.nextSpawnIndex++;
    }

    // Apply despawn events
    while (
      this.nextDespawnIndex < this.recordingData.despawnEvents.length &&
      this.recordingData.despawnEvents[this.nextDespawnIndex].timestamp <= targetTime
    ) {
      const despawnEvent = this.recordingData.despawnEvents[this.nextDespawnIndex];
      this.currentEntityStates.delete(despawnEvent.id);
      this.nextDespawnIndex++;
    }

    // Apply transform deltas
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
    console.log(`Playback speed set to ${speed}x`);
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
