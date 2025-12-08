import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import {
  PlayerService,
  PlaybackState,
} from "../../core/services/gameplay/player-service.js";
import { RecorderService } from "../../core/services/gameplay/recorder-service.js";
import { container } from "../../core/services/di-container.js";

export class RecordingInspectorWindow extends BaseWindow {
  private playerService: PlayerService;
  private recorderService: RecorderService;
  private selectedFile: File | null = null;
  private fileInputElement: HTMLInputElement | null = null;
  private errorMessage: string = "";

  constructor() {
    super("Recording inspector", new ImVec2(380, 300));
    this.playerService = container.get(PlayerService);
    this.recorderService = container.get(RecorderService);
    console.log(`${this.constructor.name} created`);
    this.createFileInput();
  }

  private createFileInput(): void {
    // Create a hidden file input element
    this.fileInputElement = document.createElement("input");
    this.fileInputElement.type = "file";
    this.fileInputElement.accept = ".hrec";
    this.fileInputElement.style.display = "none";
    this.fileInputElement.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.selectedFile = target.files[0];
        this.loadRecording();
      }
    });
    document.body.appendChild(this.fileInputElement);
  }

  private async loadRecording(): Promise<void> {
    if (!this.selectedFile) {
      return;
    }

    try {
      this.errorMessage = "";
      await this.playerService.loadRecording(this.selectedFile);
      console.log(`Loaded recording: ${this.selectedFile.name}`);
    } catch (error) {
      this.errorMessage = `Failed to load recording: ${error instanceof Error ? error.message : String(error)}`;
      console.error("Failed to load recording:", error);
    }
  }

  protected override renderContent(): void {
    if (ImGui.BeginTabBar("##RecordingTabs")) {
      if (ImGui.BeginTabItem("Recorder")) {
        this.renderRecorderTab();
        ImGui.EndTabItem();
      }
      if (ImGui.BeginTabItem("Player")) {
        this.renderPlayerTab();
        ImGui.EndTabItem();
      }
      ImGui.EndTabBar();
    }
  }

  private renderRecorderTab(): void {
    this.renderRecorderStatus();
    ImGui.Separator();
    this.renderRecorderControls();
  }

  private renderPlayerTab(): void {
    this.renderFileSelection();
    ImGui.Separator();
    this.renderPlaybackControls();
    ImGui.Separator();
    this.renderTimelineControls();
  }

  private renderRecorderStatus(): void {
    ImGui.SeparatorText("Status");

    const isRecording = this.recorderService.isRecording();
    const frameCount = this.recorderService.getFrameCount();
    const durationMs = this.recorderService.getRecordingDuration();
    const maxDuration = this.recorderService.getMaxDurationMinutes();

    // Recording status
    if (isRecording) {
      ImGui.PushStyleColor(ImGui.Col.Text, 0xff0000ff);
      ImGui.Text("RECORDING");
      ImGui.PopStyleColor();
    } else {
      ImGui.TextDisabled("Not Recording");
    }

    // Duration
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    ImGui.Text(
      `Duration: ${minutes}:${seconds
        .toString()
        .padStart(2, "0")} / ${maxDuration}:00`
    );

    // Progress bar
    const progress = Math.min(durationMs / (maxDuration * 60000), 1.0);
    ImGui.ProgressBar(
      progress,
      new ImVec2(-1, 0),
      `${Math.floor(progress * 100)}%`
    );

    // Frame count
    ImGui.Text(`Frames: ${frameCount.toLocaleString()}`);

    // Memory estimate (rough calculation)
    const estimatedMB = ((frameCount * 0.5) / 1024).toFixed(2);
    ImGui.Text(`Est. Size: ~${estimatedMB} MB`);
  }

  private renderRecorderControls(): void {
    ImGui.SeparatorText("Controls");

    const isRecording = this.recorderService.isRecording();
    const isPaused = this.recorderService.isPaused();
    const hasFrames = this.recorderService.getFrameCount() > 0;

    // Unified Start/Pause button
    if (isRecording && !isPaused) {
      if (ImGui.Button("Pause")) {
        this.recorderService.pauseRecording();
      }
    } else if (isRecording && isPaused) {
      if (ImGui.Button("Resume")) {
        this.recorderService.resumeRecording();
      }
    } else {
      if (ImGui.Button("Start")) {
        this.recorderService.startRecording();
      }
    }

    ImGui.SameLine();

    // Stop button
    if (!isRecording) {
      ImGui.BeginDisabled();
    }
    if (ImGui.Button("Stop")) {
      this.recorderService.stopRecording();
    }
    if (!isRecording) {
      ImGui.EndDisabled();
    }

    ImGui.SameLine();

    // Export button
    if (!hasFrames || isRecording) {
      ImGui.BeginDisabled();
    }
    if (ImGui.Button("Export")) {
      this.recorderService.downloadRecording();
    }
    if (!hasFrames || isRecording) {
      ImGui.EndDisabled();
    }

    ImGui.SameLine();

    // Clear button
    if (!hasFrames || isRecording) {
      ImGui.BeginDisabled();
    }
    if (ImGui.Button("Clear")) {
      this.recorderService.clearRecording();
    }
    if (!hasFrames || isRecording) {
      ImGui.EndDisabled();
    }
  }

  private renderFileSelection(): void {
    ImGui.SeparatorText("File");

    if (ImGui.Button("Select File")) {
      this.fileInputElement?.click();
    }

    if (this.selectedFile) {
      ImGui.Text("Loaded:");
      ImGui.SameLine();
      ImGui.PushStyleColor(ImGui.Col.Text, 0xff00ff00);
      ImGui.Text(this.selectedFile.name);
      ImGui.PopStyleColor();

      // File size
      const sizeMB = (this.selectedFile.size / 1024 / 1024).toFixed(2);
      ImGui.Text(`Size: ${sizeMB} MB`);

      if (ImGui.Button("Unload")) {
        this.playerService.unload();
        this.selectedFile = null;
        this.errorMessage = "";
      }
    }

    if (this.errorMessage) {
      ImGui.PushStyleColor(ImGui.Col.Text, 0xff0000ff);
      ImGui.Text(this.errorMessage);
      ImGui.PopStyleColor();
    }

    if (this.playerService.isLoaded()) {
      const metadata = this.playerService.getRecordingMetadata();
      if (metadata) {
        ImGui.Separator();
        ImGui.Text(`Frames: ${metadata.totalFrames.toLocaleString()}`);
        const durationSec = this.playerService.getTotalDurationMs() / 1000;
        const minutes = Math.floor(durationSec / 60);
        const seconds = Math.floor(durationSec % 60);
        ImGui.Text(
          `Duration: ${minutes}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }
  }

  private renderPlaybackControls(): void {
    ImGui.SeparatorText("Playback");

    const isLoaded = this.playerService.isLoaded();
    const state = this.playerService.getPlaybackState();

    if (!isLoaded) {
      ImGui.BeginDisabled();
    }

    // Play/Pause unified button
    if (state === PlaybackState.Playing) {
      if (ImGui.Button("Pause")) {
        this.playerService.pause();
      }
    } else if (state === PlaybackState.Paused) {
      if (ImGui.Button("Resume")) {
        this.playerService.play();
      }
    } else {
      if (ImGui.Button("Play")) {
        this.playerService.play();
      }
    }

    ImGui.SameLine();

    // Stop button
    if (state === PlaybackState.Stopped) {
      ImGui.BeginDisabled();
    }
    if (ImGui.Button("Stop")) {
      this.playerService.stop();
    }
    if (state === PlaybackState.Stopped) {
      ImGui.EndDisabled();
    }

    if (!isLoaded) {
      ImGui.EndDisabled();
    }

    // Speed controls
    ImGui.Text("Speed:");
    const speeds = [0.25, 0.5, 1.0, 2.0, 4.0];
    const currentSpeed = this.playerService.getPlaybackSpeed();

    for (let i = 0; i < speeds.length; i++) {
      const speed = speeds[i];
      const isActive = Math.abs(currentSpeed - speed) < 0.01;

      if (isActive) {
        ImGui.BeginDisabled();
      }

      if (ImGui.Button(`${speed}x`)) {
        this.playerService.setPlaybackSpeed(speed);
      }

      if (isActive) {
        ImGui.EndDisabled();
      }

      if (i < speeds.length - 1) {
        ImGui.SameLine();
      }
    }
  }

  private renderTimelineControls(): void {
    ImGui.SeparatorText("Timeline");

    if (!this.playerService.isLoaded()) {
      ImGui.BeginDisabled();
      ImGui.Text("0:00 / 0:00");
      ImGui.SetNextItemWidth(-1);
      ImGui.SliderFloat("##Timeline", [0], 0, 1, "");
      ImGui.EndDisabled();
      return;
    }

    const currentFrame = this.playerService.getCurrentFrameIndex();
    const totalFrames = this.playerService.getTotalFrames();
    const progress = this.playerService.getProgress();

    // Time display
    const currentTimeMs = this.playerService.getCurrentTimeMs();
    const totalTimeMs = this.playerService.getTotalDurationMs();
    const currentMin = Math.floor(currentTimeMs / 60000);
    const currentSec = Math.floor((currentTimeMs % 60000) / 1000);
    const totalMin = Math.floor(totalTimeMs / 60000);
    const totalSec = Math.floor((totalTimeMs % 60000) / 1000);

    ImGui.Text(
      `${currentMin}:${currentSec
        .toString()
        .padStart(2, "0")} / ${totalMin}:${totalSec
        .toString()
        .padStart(2, "0")}`
    );

    // Timeline slider
    const progressValue = [progress];
    ImGui.SetNextItemWidth(-1);
    if (ImGui.SliderFloat("##Timeline", progressValue, 0, 1, "")) {
      const targetFrame = Math.floor(progressValue[0] * totalFrames);
      this.playerService.seekToFrame(targetFrame);
    }

    // Frame info (smaller text)
    ImGui.PushStyleColor(ImGui.Col.Text, 0xff808080);
    ImGui.Text(`Frame ${currentFrame} / ${totalFrames}`);
    ImGui.PopStyleColor();
  }

  public override close(): void {
    super.close();
    // Clean up file input element
    if (this.fileInputElement && this.fileInputElement.parentNode) {
      this.fileInputElement.parentNode.removeChild(this.fileInputElement);
      this.fileInputElement = null;
    }
  }
}
