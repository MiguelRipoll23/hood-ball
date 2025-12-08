import { injectable } from "@needle-di/core";
import type { RecordingData, RecordedFrame } from "./recorder-service.js";
import { BinaryReader } from "../../utils/binary-reader-utils.js";

export enum PlaybackState {
  Stopped = "stopped",
  Playing = "playing",
  Paused = "paused",
}

@injectable()
export class PlayerService {
  private recordingData: RecordingData | null = null;
  private currentFrameIndex = 0;
  private playbackState: PlaybackState = PlaybackState.Stopped;
  private playbackSpeed = 1.0;
  private lastFrameTime = 0;

  constructor() {
    console.log("PlayerService initialized");
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

      // Read version
      const versionMajor = reader.unsignedInt8();
      const versionMinor = reader.unsignedInt8();
      console.log(`Recording version: ${versionMajor}.${versionMinor}`);

      // Read metadata
      const startTime = reader.float64();
      const endTime = reader.float64();
      const totalFrames = reader.unsignedInt32();
      const fps = reader.unsignedInt16();

      // Read frame count
      const frameCount = reader.unsignedInt32();
      const frames: RecordedFrame[] = [];

      // Read each frame
      for (let i = 0; i < frameCount; i++) {
        const timestamp = reader.float64();

        // Read entities
        const entityCount = reader.unsignedInt16();
        const entities = [];
        for (let j = 0; j < entityCount; j++) {
          const id = reader.variableLengthString();
          const type = reader.variableLengthString();
          const x = reader.float32();
          const y = reader.float32();
          const width = reader.float32();
          const height = reader.float32();
          const visible = reader.boolean();
          const opacity = reader.float32();

          // Read properties
          const propCount = reader.unsignedInt8();
          const properties: Record<string, unknown> = {};
          for (let k = 0; k < propCount; k++) {
            const key = reader.variableLengthString();
            const valueJson = reader.variableLengthString();
            properties[key] = JSON.parse(valueJson);
          }

          entities.push({
            id,
            type,
            x,
            y,
            width,
            height,
            visible,
            opacity,
            properties,
          });
        }

        // Read events
        const eventCount = reader.unsignedInt16();
        const events = [];
        for (let j = 0; j < eventCount; j++) {
          const type = reader.unsignedInt16();
          const consumed = reader.boolean();
          const dataJson = reader.variableLengthString();
          const data = JSON.parse(dataJson);

          events.push({ type, consumed, data });
        }

        frames.push({ timestamp, entities, events });
      }

      this.recordingData = {
        metadata: {
          version: `${versionMajor}.${versionMinor}`,
          startTime,
          endTime,
          totalFrames,
          fps,
        },
        frames,
      };

      this.currentFrameIndex = 0;
      this.playbackState = PlaybackState.Stopped;
      console.log(`Recording loaded: ${totalFrames} frames, ${fps} FPS`);
    } catch (error) {
      console.error("Failed to load recording:", error);
      throw error;
    }
  }

  public loadRecordingFromData(data: RecordingData): void {
    if (!this.validateRecordingData(data)) {
      throw new Error("Invalid recording data format");
    }

    this.recordingData = data;
    this.currentFrameIndex = 0;
    this.playbackState = PlaybackState.Stopped;
    console.log(
      `Recording loaded: ${data.metadata.totalFrames} frames, ${data.metadata.fps} FPS`
    );
  }

  private validateRecordingData(data: unknown): data is RecordingData {
    const d = data as Record<string, unknown>;
    const metadata = d?.metadata as Record<string, unknown>;
    const frames = d?.frames;

    return (
      data !== null &&
      data !== undefined &&
      metadata !== undefined &&
      frames !== undefined &&
      Array.isArray(frames) &&
      typeof metadata.totalFrames === "number" &&
      typeof metadata.fps === "number"
    );
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
    this.lastFrameTime = 0;
    console.log("Playback started");
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
    this.currentFrameIndex = 0;
    console.log("Playback stopped");
  }

  public seekToFrame(frameIndex: number): void {
    if (!this.recordingData) {
      console.warn("No recording loaded");
      return;
    }

    if (frameIndex < 0 || frameIndex >= this.recordingData.frames.length) {
      console.warn("Frame index out of bounds");
      return;
    }

    this.currentFrameIndex = frameIndex;
    console.log(`Seeked to frame ${frameIndex}`);
  }

  public seekToTime(timeMs: number): void {
    if (!this.recordingData) {
      console.warn("No recording loaded");
      return;
    }

    // Use binary search to find the frame closest to the requested time
    // O(log N) instead of O(N) - significant for large recordings (54k frames at 60fps/15min)
    const frames = this.recordingData.frames;
    let left = 0;
    let right = frames.length - 1;
    let closestIndex = 0;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midTime = frames[mid].timestamp;

      if (midTime === timeMs) {
        closestIndex = mid;
        break;
      }

      if (midTime < timeMs) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }

      // Update closest based on absolute difference
      if (
        Math.abs(frames[mid].timestamp - timeMs) <
        Math.abs(frames[closestIndex].timestamp - timeMs)
      ) {
        closestIndex = mid;
      }
    }

    // Check neighbors for potentially closer match
    if (closestIndex > 0) {
      const prevDiff = Math.abs(frames[closestIndex - 1].timestamp - timeMs);
      const currDiff = Math.abs(frames[closestIndex].timestamp - timeMs);
      if (prevDiff < currDiff) {
        closestIndex--;
      }
    }
    if (closestIndex < frames.length - 1) {
      const nextDiff = Math.abs(frames[closestIndex + 1].timestamp - timeMs);
      const currDiff = Math.abs(frames[closestIndex].timestamp - timeMs);
      if (nextDiff < currDiff) {
        closestIndex++;
      }
    }

    this.seekToFrame(closestIndex);
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
    if (!this.recordingData) {
      console.warn("No recording loaded");
      return;
    }

    if (this.currentFrameIndex < this.recordingData.frames.length - 1) {
      this.currentFrameIndex++;
      console.log(`Stepped to frame ${this.currentFrameIndex}`);
    }
  }

  public stepBackward(): void {
    if (!this.recordingData) {
      console.warn("No recording loaded");
      return;
    }

    if (this.currentFrameIndex > 0) {
      this.currentFrameIndex--;
      console.log(`Stepped to frame ${this.currentFrameIndex}`);
    }
  }

  public update(deltaTimeMs: number): RecordedFrame | null {
    if (!this.recordingData || this.playbackState !== PlaybackState.Playing) {
      return null;
    }

    // Calculate how much time has passed adjusted for playback speed
    const adjustedDelta = deltaTimeMs * this.playbackSpeed;
    this.lastFrameTime += adjustedDelta;

    // Check if we reached the end - capture last frame before stopping
    if (this.currentFrameIndex >= this.recordingData.frames.length - 1) {
      const lastFrame = this.recordingData.frames[this.currentFrameIndex];
      this.stop();
      return lastFrame;
    }

    // Advance through multiple frames if needed
    while (
      this.currentFrameIndex < this.recordingData.frames.length - 1 &&
      this.lastFrameTime >= 0
    ) {
      const currentFrame = this.recordingData.frames[this.currentFrameIndex];
      const nextFrame = this.recordingData.frames[this.currentFrameIndex + 1];
      const frameDuration = nextFrame.timestamp - currentFrame.timestamp;

      if (this.lastFrameTime >= frameDuration) {
        this.currentFrameIndex++;
        this.lastFrameTime -= frameDuration;
      } else {
        break; // Not enough time to advance to next frame
      }
    }

    // Clamp to last frame if we somehow overshot
    if (this.currentFrameIndex >= this.recordingData.frames.length) {
      this.currentFrameIndex = this.recordingData.frames.length - 1;
      this.lastFrameTime = 0;
    }

    return this.getCurrentFrame();
  }

  public getCurrentFrame(): RecordedFrame | null {
    if (
      !this.recordingData ||
      this.currentFrameIndex >= this.recordingData.frames.length
    ) {
      return null;
    }

    return this.recordingData.frames[this.currentFrameIndex];
  }

  public getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }

  public getTotalFrames(): number {
    return this.recordingData?.frames.length ?? 0;
  }

  public getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  public isLoaded(): boolean {
    return this.recordingData !== null;
  }

  public getRecordingMetadata(): RecordingData["metadata"] | null {
    return this.recordingData?.metadata ?? null;
  }

  public getCurrentTimeMs(): number {
    const frame = this.getCurrentFrame();
    return frame?.timestamp ?? 0;
  }

  public getTotalDurationMs(): number {
    if (!this.recordingData || this.recordingData.frames.length === 0) {
      return 0;
    }

    const lastFrame =
      this.recordingData.frames[this.recordingData.frames.length - 1];
    return lastFrame.timestamp;
  }

  public getProgress(): number {
    if (!this.recordingData || this.recordingData.frames.length === 0) {
      return 0;
    }

    // Use (currentFrameIndex + 1) to show 100% on the last frame
    const progress =
      (this.currentFrameIndex + 1) / this.recordingData.frames.length;
    return Math.min(progress, 1.0); // Clamp to 1.0
  }

  public unload(): void {
    this.stop();
    this.recordingData = null;
    console.log("Recording unloaded");
  }

  public render(context: CanvasRenderingContext2D): void {
    if (!this.recordingData || this.playbackState === PlaybackState.Stopped) {
      return;
    }

    const currentFrame = this.getCurrentFrame();
    if (!currentFrame) {
      return;
    }

    // Save context state
    context.save();

    // Render each entity from the recording
    for (const entity of currentFrame.entities) {
      if (!entity.visible) {
        continue;
      }

      context.save();

      // Apply opacity
      context.globalAlpha = entity.opacity;

      // For now, render entities as simple rectangles with their type label
      // In a full implementation, you would instantiate actual entity classes
      context.fillStyle = "#4488ff";
      context.strokeStyle = "#0044aa";
      context.lineWidth = 2;

      context.fillRect(entity.x, entity.y, entity.width, entity.height);
      context.strokeRect(entity.x, entity.y, entity.width, entity.height);

      // Draw entity type label
      context.fillStyle = "#ffffff";
      context.font = "10px monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        entity.type.split(/(?=[A-Z])/).join(" "), // Split camelCase
        entity.x + entity.width / 2,
        entity.y + entity.height / 2
      );

      context.restore();
    }

    // Render playback overlay
    this.renderPlaybackOverlay(context);

    context.restore();
  }

  private renderPlaybackOverlay(context: CanvasRenderingContext2D): void {
    if (!this.recordingData) {
      return;
    }

    // Draw playback indicator
    const padding = 10;
    const overlayHeight = 40;
    const overlayY = context.canvas.height - overlayHeight - padding;

    // Semi-transparent background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(
      padding,
      overlayY,
      context.canvas.width - padding * 2,
      overlayHeight
    );

    // Draw playback info
    context.fillStyle = "#ffffff";
    context.font = "12px monospace";
    context.textAlign = "left";
    context.textBaseline = "top";

    const currentTime = this.getCurrentTimeMs() / 1000;
    const totalTime = this.getTotalDurationMs() / 1000;
    const timeText = `${currentTime.toFixed(1)}s / ${totalTime.toFixed(1)}s`;
    const frameText = `Frame ${this.currentFrameIndex + 1}/${
      this.recordingData.frames.length
    }`;
    const stateText =
      this.playbackState === PlaybackState.Playing
        ? `▶ Playing (${this.playbackSpeed}x)`
        : this.playbackState === PlaybackState.Paused
        ? "⏸ Paused"
        : "⏹ Stopped";

    context.fillText(stateText, padding + 10, overlayY + 5);
    context.fillText(timeText, padding + 10, overlayY + 20);

    context.textAlign = "right";
    context.fillText(
      frameText,
      context.canvas.width - padding - 10,
      overlayY + 12
    );

    // Draw progress bar
    const progressBarY = overlayY + overlayHeight - 8;
    const progressBarWidth = context.canvas.width - padding * 2 - 20;
    const progressBarX = padding + 10;

    // Background
    context.fillStyle = "rgba(255, 255, 255, 0.3)";
    context.fillRect(progressBarX, progressBarY, progressBarWidth, 4);

    // Progress
    const progress = this.getProgress();
    context.fillStyle = "#4488ff";
    context.fillRect(
      progressBarX,
      progressBarY,
      progressBarWidth * progress,
      4
    );
  }
}
