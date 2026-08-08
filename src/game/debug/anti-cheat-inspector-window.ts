import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../engine/debug/base-window.js";
import { container } from "../../engine/services/di-container.js";
import { AntiCheatReportingService } from "../services/security/anti-cheat-reporting-service.js";
import { AntiCheatService } from "../services/security/anti-cheat-service.js";
import { MatchSessionService } from "../services/session/match-session-service.js";
import { AntiCheatRuleType } from "../enums/anti-cheat-rule-type.js";
import { GameEventType } from "../enums/event-type.js";
import type { AntiCheatRule } from "../models/anti-cheat-rule.js";
import type { ReportedViolation } from "../services/security/anti-cheat-reporting-service.js";
import { EngineLogger } from "../../engine/services/engine-logger.js";

const RULE_TYPE_NAMES: Record<number, string> = {
  [AntiCheatRuleType.EventRateLimit]: "Event Rate Limit",
  [AntiCheatRuleType.MovementSpeedLimit]: "Movement Speed Limit",
};

const GREEN = 0x00ff00ff;
const YELLOW = 0xffff00ff;
const RED = 0xff0000ff;

const RULES_TABLE_ROWS = 6;
const VIOLATIONS_TABLE_ROWS = 8;

export class AntiCheatInspectorWindow extends BaseWindow {
  private readonly antiCheat: AntiCheatService;
  private readonly reporting: AntiCheatReportingService;
  private readonly matchSessionService: MatchSessionService;

  constructor() {
    super("Anti-cheat inspector", new ImVec2(480, 350));
    this.antiCheat = container.get(AntiCheatService);
    this.reporting = container.get(AntiCheatReportingService);
    this.matchSessionService = container.get(MatchSessionService);
    EngineLogger.info(
      "AntiCheatInspectorWindow",
      "AntiCheatInspectorWindow created",
    );
  }

  protected override renderContent(): void {
    const match = this.matchSessionService.getMatch();

    // ── State ──
    const monitoring = this.antiCheat.isMonitoring();
    ImGui.Text("State: ");
    ImGui.SameLine(0, 0);
    ImGui.PushStyleColor(ImGui.Col.Text, monitoring ? GREEN : RED);
    ImGui.Text(monitoring ? "active" : "inactive");
    ImGui.PopStyleColor();

    if (ImGui.Button(monitoring ? "Stop" : "Start")) {
      if (monitoring) {
        this.antiCheat.stopMonitoring();
      } else {
        this.antiCheat.startMonitoring();
      }
    }

    // ── Rules ──
    if (
      ImGui.CollapsingHeader("Rules", ImGui.TreeNodeFlags.DefaultOpen)
    ) {
      const rules = this.antiCheat.getRules();
      if (rules.length === 0) {
        ImGui.Text("No rules loaded.");
      } else {
        this.renderRulesTable(rules);
      }
    }

    // ── Violations ──
    if (
      ImGui.CollapsingHeader(
        "Violation History",
        ImGui.TreeNodeFlags.DefaultOpen,
      )
    ) {
      const violations = this.reporting.getReportedViolations();
      if (violations.length === 0) {
        ImGui.Text("No violations reported yet.");
      } else {
        this.renderViolationsTable(violations, match);
      }
    }
  }

  private renderRulesTable(rules: readonly AntiCheatRule[]): void {
    const flags =
      ImGui.TableFlags.BordersOuter |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.SizingStretchProp;

    const outerSize = new ImVec2(0, RULES_TABLE_ROWS * 20 + ImGui.GetTextLineHeightWithSpacing());
    if (!ImGui.BeginTable("AntiCheatRules", 3, flags, outerSize)) return;

    ImGui.TableSetupColumn("ID", ImGui.TableColumnFlags.WidthFixed, 30);
    ImGui.TableSetupColumn("Type", ImGui.TableColumnFlags.WidthStretch);
    ImGui.TableSetupColumn("Fields", ImGui.TableColumnFlags.WidthStretch);

    ImGui.TableHeadersRow();

    for (const rule of rules) {
      ImGui.TableNextRow();
      const typeName =
        RULE_TYPE_NAMES[rule.ruleType] ?? `Unknown (${rule.ruleType})`;

      // ID
      ImGui.TableSetColumnIndex(0);
      ImGui.Text(rule.ruleId.toString());

      // Type
      ImGui.TableSetColumnIndex(1);
      ImGui.Text(typeName);

      // Fields
      ImGui.TableSetColumnIndex(2);
      const fieldText = rule.fields
        .map((f) => this.formatField(rule.ruleType, f.fieldId, f.value))
        .join(", ");
      ImGui.Text(fieldText);
    }

    ImGui.EndTable();
  }

  private renderViolationsTable(
    violations: readonly ReportedViolation[],
    match: ReturnType<MatchSessionService["getMatch"]>,
  ): void {
    const flags =
      ImGui.TableFlags.BordersOuter |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.SizingStretchProp;

    const outerSize = new ImVec2(0, VIOLATIONS_TABLE_ROWS * 20 + ImGui.GetTextLineHeightWithSpacing());
    if (!ImGui.BeginTable("AntiCheatViolations", 5, flags, outerSize)) return;

    ImGui.TableSetupColumn("Rule", ImGui.TableColumnFlags.WidthFixed, 40);
    ImGui.TableSetupColumn("Player", ImGui.TableColumnFlags.WidthStretch);
    ImGui.TableSetupColumn("Reason", ImGui.TableColumnFlags.WidthStretch);
    ImGui.TableSetupColumn(
      "Time",
      ImGui.TableColumnFlags.WidthFixed,
      90,
    );
    ImGui.TableSetupColumn(
      "Relative",
      ImGui.TableColumnFlags.WidthFixed,
      70,
    );

    ImGui.TableHeadersRow();

    const now = Date.now();

    for (const v of violations) {
      ImGui.TableNextRow();

      const player = match?.getPlayerByNetworkId(v.userId);
      const playerName =
        player?.getName() ?? v.userId.substring(0, 8) + "...";

      // Rule ID
      ImGui.TableSetColumnIndex(0);
      ImGui.Text(`#${v.ruleId}`);

      // Player
      ImGui.TableSetColumnIndex(1);
      ImGui.PushStyleColor(ImGui.Col.Text, YELLOW);
      ImGui.Text(playerName);
      ImGui.PopStyleColor();

      // Reason
      ImGui.TableSetColumnIndex(2);
      ImGui.Text(v.reason);

      // Player time (absolute)
      ImGui.TableSetColumnIndex(3);
      const date = new Date(v.timestamp);
      const timeStr = date.toLocaleTimeString();
      ImGui.Text(timeStr);

      // Relative time
      ImGui.TableSetColumnIndex(4);
      const elapsedMs = now - v.timestamp;
      const elapsedStr = this.formatElapsed(elapsedMs);
      ImGui.Text(elapsedStr);
    }

    ImGui.EndTable();
  }

  private formatElapsed(ms: number): string {
    if (ms < 1000) return "just now";
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  }

  private formatField(
    ruleType: number,
    fieldId: number,
    value: number,
  ): string {
    if (ruleType === AntiCheatRuleType.EventRateLimit) {
      if (fieldId === 0)
        return `event=${(GameEventType as Record<number, string>)[value] ?? value}`;
      if (fieldId === 1) return `maxCount=${value}`;
      if (fieldId === 2) return `window=${value}s`;
    }
    if (ruleType === AntiCheatRuleType.MovementSpeedLimit) {
      if (fieldId === 0) return `maxDist=${value}px`;
      if (fieldId === 1) return `window=${value}s`;
      if (fieldId === 2) return value !== 0 ? `typeId=${value}` : "all types";
    }
    return `f${fieldId}=${value}`;
  }
}
