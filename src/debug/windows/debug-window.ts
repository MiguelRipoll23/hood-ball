import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import { ScreenInspectorWindow } from "./screen-inspector-window.js";
import { EventInspectorWindow } from "./event-inspector-window.js";
import { MatchInspectorWindow } from "./match-inspector-window.js";
import { BaseWindow } from "./base-window.js";
import { PeerInspectorWindow } from "./peer-inspector-window.js";
import type { GameState } from "../../models/game-state.js";

export class DebugWindow extends BaseWindow {
  private eventInspectorWindow: EventInspectorWindow;
  private screenInspectorWindow: ScreenInspectorWindow;
  private matchInspectorWindow: MatchInspectorWindow;
  private peerInspectorWindow: PeerInspectorWindow;

  constructor(private gameState: GameState) {
    super("Debug menu", new ImVec2(220, 220), false, ImGui.WindowFlags.MenuBar);
    this.eventInspectorWindow = new EventInspectorWindow();
    this.screenInspectorWindow = new ScreenInspectorWindow(gameState);
    this.matchInspectorWindow = new MatchInspectorWindow(gameState);
    this.peerInspectorWindow = new PeerInspectorWindow();
    this.open();
  }

  protected override renderContent(): void {
    this.renderMenu();
  }

  public override render(): void {
    super.render();

    // Always render child windows so they remain visible even when
    // the debug menu window itself is closed
    if (this.eventInspectorWindow.isOpen()) {
      this.eventInspectorWindow.render();
    }

    if (this.screenInspectorWindow.isOpen()) {
      this.screenInspectorWindow.render();
    }

    if (this.matchInspectorWindow.isOpen()) {
      this.matchInspectorWindow.render();
    }

    if (this.peerInspectorWindow.isOpen()) {
      this.peerInspectorWindow.render();
    }
  }

  private renderMenu(): void {
    this.renderMenuBar();
    this.renderLoggingSettings();
    this.renderUISettings();
  }

  private renderMenuBar(): void {
    if (ImGui.BeginMenuBar()) {
      if (ImGui.BeginMenu("Inspectors")) {
        if (ImGui.MenuItem("Event", "E")) {
          this.eventInspectorWindow.toggle();
        }

        if (ImGui.MenuItem("Screen", "S")) {
          this.screenInspectorWindow.toggle();
        }

        if (ImGui.MenuItem("Match", "M")) {
          this.matchInspectorWindow.toggle();
        }

        if (ImGui.MenuItem("Peers", "P")) {
          this.peerInspectorWindow.toggle();
        }

        ImGui.EndMenu();
      }
      ImGui.EndMenuBar();
    }
  }

  private renderLoggingSettings(): void {
    if (ImGui.CollapsingHeader("Logging", ImGui.TreeNodeFlags.DefaultOpen)) {
      const debugSettings = this.gameState.getDebugSettings();

      this.renderCheckbox(
        "Log WebSocket messages",
        debugSettings.isWebSocketLoggingEnabled(),
        debugSettings.setWebSocketLogging.bind(debugSettings)
      );

      this.renderCheckbox(
        "Log WebRTC messages",
        debugSettings.isWebRTCLoggingEnabled(),
        debugSettings.setWebRTCLogging.bind(debugSettings)
      );
    }
  }

  private renderUISettings(): void {
    if (ImGui.CollapsingHeader("UI", ImGui.TreeNodeFlags.DefaultOpen)) {
      const debugSettings = this.gameState.getDebugSettings();

      this.renderCheckbox(
        "Show tappable areas",
        debugSettings.areTappableAreasVisible(),
        debugSettings.setTappableAreasVisibility.bind(debugSettings)
      );

      this.renderCheckbox(
        "Show hitboxes",
        debugSettings.areHitboxesVisible(),
        debugSettings.setHitboxesVisibility.bind(debugSettings)
      );

      this.renderCheckbox(
        "Show gizmos",
        debugSettings.areGizmosVisible(),
        debugSettings.setGizmosVisibility.bind(debugSettings)
      );
    }
  }

  private renderCheckbox(
    label: string,
    currentValue: boolean,
    onChange: (newValue: boolean) => void
  ): void {
    const value = [currentValue];
    if (ImGui.Checkbox(label, value)) {
      onChange(value[0]);
    }
  }
}
