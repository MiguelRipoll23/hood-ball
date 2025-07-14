import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import { ConsoleLogService } from "../../core/services/debug/console-log-service.js";
import type { LogLevel } from "../../core/services/debug/console-log-service.js";
import { container } from "../../core/services/di-container.js";

export class ConsoleWindow extends BaseWindow {
  private readonly consoleLogService: ConsoleLogService;
  private readonly levelFilters: Record<LogLevel, boolean> = {
    log: true,
    info: true,
    warn: true,
    error: true,
    debug: true,
  };

  constructor() {
    super("Console", new ImVec2(450, 260));
    this.consoleLogService = container.get(ConsoleLogService);
  }

  protected override renderContent(): void {
    this.renderFilterOptions();
    this.renderLogEntries();
  }

  private renderFilterOptions(): void {
    ImGui.BeginGroup();
    (Object.keys(this.levelFilters) as LogLevel[]).forEach((level) => {
      ImGui.SameLine();
      const value = [this.levelFilters[level]];
      if (ImGui.Checkbox(level, value)) {
        this.levelFilters[level] = value[0];
      }
    });
    ImGui.EndGroup();

    if (ImGui.Button("Clear")) {
      this.consoleLogService.clear();
    }
    ImGui.Separator();
  }

  private renderLogEntries(): void {
    const tableFlags =
      ImGui.TableFlags.Borders |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.SizingStretchProp;

    const entries = this.consoleLogService
      .getEntries()
      .filter((e) => this.levelFilters[e.level]);

    if (ImGui.BeginTable("ConsoleTable", 2, tableFlags, new ImVec2(0, 200))) {
      ImGui.TableSetupColumn("Level", ImGui.TableColumnFlags.WidthFixed, 60);
      ImGui.TableSetupColumn("Message", ImGui.TableColumnFlags.WidthStretch);
      ImGui.TableHeadersRow();

      entries.forEach((entry) => {
        ImGui.TableNextRow();
        ImGui.TableSetColumnIndex(0);
        ImGui.Text(entry.level.toUpperCase());
        ImGui.TableSetColumnIndex(1);
        const color = this.getColor(entry.level);
        ImGui.PushStyleColor(ImGui.Col.Text, color);
        ImGui.TextWrapped(entry.message);
        ImGui.PopStyleColor();
      });

      ImGui.EndTable();
    }
  }

  private getColor(level: LogLevel): number {
    switch (level) {
      case "error":
        return 0xffff0000;
      case "warn":
        return 0xffffff00;
      case "info":
        return 0xff00ffff;
      case "debug":
        return 0xff00ff00;
      default:
        return 0xffffffff;
    }
  }
}
