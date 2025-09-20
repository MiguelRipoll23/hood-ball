import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import { AnimationLogService } from "../../core/services/gameplay/animation-log-service.js";
import { container } from "../../core/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class AnimationInspectorWindow extends BaseWindow {
  private static readonly COLOR_FINISHED = 0xff00ff00;
  // Use ABGR format for consistency with other debug colors
  private static readonly COLOR_IN_PROGRESS = 0xff00a5ff; // orange
  private readonly animationLogService: AnimationLogService;
  private previousEntryCount = 0;

  constructor() {
    // Slightly increased window height for better readability
    super("Animation inspector", new ImVec2(350, 260));
    this.animationLogService = container.get(AnimationLogService);
  }

  protected override renderContent(): void {
    const entries = this.animationLogService.getEntries();
    const newEntryAdded = entries.length > this.previousEntryCount;

    const tableFlags =
      ImGui.TableFlags.Borders |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.SizingStretchProp;

    if (ImGui.BeginTable("AnimationsTable", 3, tableFlags, new ImVec2(0, 200))) {
      ImGui.TableSetupColumn("Entity", ImGui.TableColumnFlags.WidthStretch);
      ImGui.TableSetupColumn("Type", ImGui.TableColumnFlags.WidthFixed, 90);
      ImGui.TableSetupColumn("Progress", ImGui.TableColumnFlags.WidthFixed, 80);
      ImGui.TableHeadersRow();

      entries.forEach((entry, index) => {
        ImGui.TableNextRow();
        ImGui.TableSetColumnIndex(0);
        ImGui.Text(entry.entityName);
        ImGui.TableSetColumnIndex(1);
        ImGui.Text(entry.type);
        ImGui.TableSetColumnIndex(2);
        const progressText = `${(entry.progress * 100).toFixed(0)}%`;
        const color = entry.finished
          ? AnimationInspectorWindow.COLOR_FINISHED
          : AnimationInspectorWindow.COLOR_IN_PROGRESS;
        ImGui.PushStyleColor(ImGui.Col.Text, color);
        ImGui.Text(progressText);
        ImGui.PopStyleColor();
        if (newEntryAdded && index === entries.length - 1) {
          ImGui.SetScrollHereY(1.0);
        }
      });

      ImGui.EndTable();
      this.previousEntryCount = entries.length;
    }

    if (ImGui.Button("Clear")) {
      this.animationLogService.clear();
      this.previousEntryCount = 0;
    }
  }
}
