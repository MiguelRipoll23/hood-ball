import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import { AnimationType } from "../enums/animation-type.js";
import { AnimationLogService } from "../../core/services/gameplay/animation-log-service.js";
import { container } from "../../core/services/di-container.js";
import { injectable } from "@needle-di/core";

@injectable()
export class AnimationInspectorWindow extends BaseWindow {
  private readonly animationLogService: AnimationLogService;

  constructor() {
    // Slightly increased window height for better readability
    super("Animation inspector", new ImVec2(350, 260));
    this.animationLogService = container.get(AnimationLogService);
  }

  protected override renderContent(): void {
    const entries = this.animationLogService.getEntries();

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

      entries.forEach((entry) => {
        ImGui.TableNextRow();
        ImGui.TableSetColumnIndex(0);
        ImGui.Text(entry.entityName);
        ImGui.TableSetColumnIndex(1);
        ImGui.Text(AnimationType[entry.type]);
        ImGui.TableSetColumnIndex(2);
        const progressText = `${(entry.progress * 100).toFixed(0)}%`;
        if (entry.finished) {
          ImGui.PushStyleColor(ImGui.Col.Text, 0xff00ff00);
          ImGui.Text(progressText);
          ImGui.PopStyleColor();
        } else {
          ImGui.Text(progressText);
        }
      });

      ImGui.EndTable();
    }

    if (ImGui.Button("Clear")) {
      this.animationLogService.clear();
    }
  }
}
