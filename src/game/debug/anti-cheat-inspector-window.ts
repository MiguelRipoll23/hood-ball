import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { BaseWindow } from "../../engine/debug/base-window.js";
import { container } from "../../engine/services/di-container.js";
import { AntiCheatMonitorService } from "../services/security/anti-cheat-monitor-service.js";
import { AntiCheatReportingService } from "../services/security/anti-cheat-reporting-service.js";
import { MatchSessionService } from "../services/session/match-session-service.js";
import { AntiCheatRuleType } from "../enums/anti-cheat-rule-type.js";
import { GameEventType } from "../enums/event-type.js";
import type { AntiCheatRule } from "../models/anti-cheat-rule.js";
import { EngineLogger } from "../../engine/services/engine-logger.js";

const RULE_TYPE_NAMES: Record<number, string> = {
  [AntiCheatRuleType.EventRateLimit]: "Event Rate Limit",
  [AntiCheatRuleType.MovementSpeedLimit]: "Movement Speed Limit",
};

const GREEN = 0x00ff00ff;
const YELLOW = 0xffff00ff;
const RED = 0xff0000ff;

export class AntiCheatInspectorWindow extends BaseWindow {
  constructor() {
    super("Anti-cheat inspector", new ImVec2(500, 350));
    EngineLogger.info("AntiCheatInspectorWindow", "AntiCheatInspectorWindow created");
  }

  protected override renderContent(): void {
    const monitor = container.get(AntiCheatMonitorService);
    const reporting = container.get(AntiCheatReportingService);
    const match = container.get(MatchSessionService).getMatch();

    // ── Status ──
    if (monitor.isMonitoring()) {
      ImGui.PushStyleColor(ImGui.Col.Text, GREEN);
      ImGui.Text("ANTI-CHEAT: ACTIVE");
      ImGui.PopStyleColor();
    } else {
      ImGui.PushStyleColor(ImGui.Col.Text, RED);
      ImGui.Text("ANTI-CHEAT: INACTIVE");
      ImGui.PopStyleColor();
    }

    ImGui.Separator();

    // ── Loaded Rules ──
    if (ImGui.CollapsingHeader("Loaded Rules", ImGui.TreeNodeFlags.DefaultOpen)) {
      const rules = monitor.getRules();
      if (rules.length === 0) {
        ImGui.Text("No rules loaded.");
      } else {
        this.renderRulesTable(rules);
      }
    }

    // ── Violations ──
    if (ImGui.CollapsingHeader("Reported Violations")) {
      const reported = reporting.getReportedViolations();
      if (reported.length === 0) {
        ImGui.Text("No violations reported yet.");
      } else {
        for (const key of reported) {
          const [ruleId, userId] = key.split(":");
          const player = match?.getPlayerByNetworkId(userId);
          const playerName = player?.getName() ?? userId.substring(0, 8);
          ImGui.PushStyleColor(ImGui.Col.Text, YELLOW);
          ImGui.Text(`Rule #${ruleId} — ${playerName} (${userId.substring(0, 8)}...)`);
          ImGui.PopStyleColor();
        }
      }
    }
  }

  private renderRulesTable(
    rules: readonly AntiCheatRule[],
  ): void {
    const flags =
      ImGui.TableFlags.BordersOuter |
      ImGui.TableFlags.RowBg |
      ImGui.TableFlags.Resizable |
      ImGui.TableFlags.ScrollY |
      ImGui.TableFlags.SizingStretchProp;

    if (!ImGui.BeginTable("AntiCheatRules", 3, flags)) return;

    ImGui.TableSetupColumn("ID", ImGui.TableColumnFlags.WidthFixed, 30);
    ImGui.TableSetupColumn("Type", ImGui.TableColumnFlags.WidthStretch);
    ImGui.TableSetupColumn("Fields", ImGui.TableColumnFlags.WidthStretch);

    ImGui.TableHeadersRow();

    for (const rule of rules) {
      ImGui.TableNextRow();
      const typeName = RULE_TYPE_NAMES[rule.ruleType] ?? `Unknown (${rule.ruleType})`;

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

  private formatField(ruleType: number, fieldId: number, value: number): string {
    if (ruleType === AntiCheatRuleType.EventRateLimit) {
      if (fieldId === 0) return `event=${(GameEventType as Record<number, string>)[value] ?? value}`;
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
