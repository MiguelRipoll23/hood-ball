import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameController } from "../models/game-controller";
import { ScreenInspectorWindow } from "./screen-inspector-window";
import { EventInspectorWindow } from "./event-inspector-window";
import { MatchInspectorWindow } from "./match-window";
import { BaseWindow } from "./base-window";

export class DebugWindow extends BaseWindow {
  private eventInspectorWindow: EventInspectorWindow;
  private screenInspectorWindow: ScreenInspectorWindow;
  private matchInspectorWindow: MatchInspectorWindow;

  constructor(private gameController: GameController) {
    super("Debug menu", new ImVec2(200, 220), ImGui.WindowFlags.MenuBar);
    this.opened = true;
    this.eventInspectorWindow = new EventInspectorWindow(gameController);
    this.screenInspectorWindow = new ScreenInspectorWindow(gameController);
    this.matchInspectorWindow = new MatchInspectorWindow(gameController);
  }

  public render(): void {
    super.render();
    this.renderMenu();

    if (this.eventInspectorWindow.isOpen()) {
      this.eventInspectorWindow.render();
    }

    if (this.screenInspectorWindow.isOpen()) {
      this.screenInspectorWindow.render();
    }

    if (this.matchInspectorWindow.isOpen()) {
      this.matchInspectorWindow.render();
    }
  }

  private renderMenu(): void {
    this.renderMenuBar();
    ImGui.TextWrapped("This menu is for development and testing purposes.");
    this.renderUISettings();

    ImGui.End();
  }

  private renderMenuBar(): void {
    if (ImGui.BeginMenuBar()) {
      if (ImGui.BeginMenu("Inspectors")) {
        if (ImGui.MenuItem("Event", "E")) {
          this.toggleWindow("event");
        }

        if (ImGui.MenuItem("Screen", "S")) {
          this.toggleWindow("screen");
        }

        if (ImGui.MenuItem("Match", "M")) {
          this.matchInspectorWindow.toggle();
        }

        ImGui.EndMenu();
      }
      ImGui.EndMenuBar();
    }
  }

  private toggleWindow(type: "screen" | "event" | "match"): void {
    if (type === "event") {
      this.eventInspectorWindow.toggle();
    } else if (type === "screen") {
      this.screenInspectorWindow.toggle();
    } else if (type === "match") {
      this.matchInspectorWindow.toggle();
    }
  }

  private renderUISettings(): void {
    if (ImGui.CollapsingHeader("UI", ImGui.TreeNodeFlags.DefaultOpen)) {
      const debugSettings = this.gameController.getDebugSettings();

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
