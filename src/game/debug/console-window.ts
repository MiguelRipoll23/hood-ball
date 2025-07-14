import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import { ConsoleLogService } from "../../core/services/debug/console-log-service.js";
import type { LogLevel } from "../../core/services/debug/console-log-service.js";
import { container } from "../../core/services/di-container.js";

export class ConsoleWindow extends BaseWindow {
  private readonly consoleLogService: ConsoleLogService;
  private previousEntryCount = 0;
  private readonly levelFilters: Record<LogLevel, boolean> = {
    log: true,
    info: true,
    warn: true,
    error: true,
    debug: true,
  };

  constructor() {
    super("Console", new ImVec2(600, 260));
    this.consoleLogService = container.get(ConsoleLogService);
  }

  protected override renderContent(): void {
    this.renderFilterOptions();
    this.renderLogEntries();
  }

  private renderFilterOptions(): void {
    ImGui.BeginGroup();
    (Object.keys(this.levelFilters) as LogLevel[]).forEach((level, index) => {
      if (index > 0) ImGui.SameLine();
      const value = [this.levelFilters[level]];
      ImGui.PushStyleColor(ImGui.Col.Text, this.getColor(level));
      const label = level.toUpperCase();
      if (ImGui.Checkbox(label, value)) {
        this.levelFilters[level] = value[0];
      }
      ImGui.PopStyleColor();
    });
    ImGui.SameLine();
    if (ImGui.Button("Clear")) {
      this.consoleLogService.clear();
    }
    ImGui.EndGroup();
    ImGui.Separator();
  }

  private renderLogEntries(): void {
    const tableFlags =
      ImGui.TableFlags.Borders |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.SizingStretchProp;

    const allEntries = this.consoleLogService.getEntries();
    const entries = allEntries.filter((e) => this.levelFilters[e.level]);

    if (ImGui.BeginTable("ConsoleTable", 3, tableFlags, new ImVec2(0, 200))) {
      ImGui.TableSetupColumn("Time", ImGui.TableColumnFlags.WidthFixed, 70);
      ImGui.TableSetupColumn("Level", ImGui.TableColumnFlags.WidthFixed, 60);
      ImGui.TableSetupColumn("Message", ImGui.TableColumnFlags.WidthStretch);
      ImGui.TableHeadersRow();

      entries.forEach((entry) => {
        ImGui.TableNextRow();
        ImGui.TableSetColumnIndex(0);
        const time = entry.timestamp
          .toLocaleTimeString(undefined, { hour12: false });
        ImGui.Text(time);
        ImGui.TableSetColumnIndex(1);
        ImGui.PushStyleColor(ImGui.Col.Text, this.getColor(entry.level));
        ImGui.Text(entry.level.toUpperCase());
        ImGui.PopStyleColor();
        ImGui.TableSetColumnIndex(2);
        const color = this.getColor(entry.level);
        ImGui.PushStyleColor(ImGui.Col.Text, color);
        ImGui.TextWrapped(entry.message);
        ImGui.PopStyleColor();
      });

      if (allEntries.length > this.previousEntryCount) {
        ImGui.SetScrollY(ImGui.GetScrollMaxY());
      }
      this.previousEntryCount = allEntries.length;

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
