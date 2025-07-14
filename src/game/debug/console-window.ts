import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../core/debug/base-window.js";
import { ConsoleLogService } from "../../core/services/debug/console-log-service.js";
import type { LogLevel } from "../../core/services/debug/console-log-service.js";
import { container } from "../../core/services/di-container.js";

export class ConsoleWindow extends BaseWindow {
  private readonly consoleLogService: ConsoleLogService;
  private readonly levelEmojis: Record<LogLevel, string> = {
    log: "📝",
    info: "ℹ️",
    warn: "⚠️",
    error: "❌",
    debug: "🐛",
  };
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
    (Object.keys(this.levelFilters) as LogLevel[]).forEach((level, index) => {
      if (index > 0) ImGui.SameLine();
      const value = [this.levelFilters[level]];
      const label = `${this.levelEmojis[level]} ${level}`;
      if (ImGui.Checkbox(label, value)) {
        this.levelFilters[level] = value[0];
      }
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

    const entries = this.consoleLogService
      .getEntries()
      .filter((e) => this.levelFilters[e.level]);

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
        ImGui.Text(this.levelEmojis[entry.level]);
        ImGui.TableSetColumnIndex(2);
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
