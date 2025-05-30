import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameController } from "../models/game-controller";
import { ScreenInspectorWindow } from "./screen-inspector-window";
import { EventInspectorWindow } from "./event-inspector-window";

export class DebugWindow {
  private screenInspectorWindow: ScreenInspectorWindow;
  private eventInspectorWindow: EventInspectorWindow;

  constructor(private gameController: GameController) {
    console.log(`${this.constructor.name} created`);
    this.screenInspectorWindow = new ScreenInspectorWindow(gameController);
    this.eventInspectorWindow = new EventInspectorWindow(gameController);
  }

  public render(): void {
    this.renderMainMenu();

    if (this.screenInspectorWindow.isOpen()) {
      this.screenInspectorWindow.render();
    }

    if (this.eventInspectorWindow.isOpen()) {
      this.eventInspectorWindow.render();
    }
  }

  private renderMainMenu(): void {
    ImGui.SetNextWindowSize(new ImVec2(200, 220), ImGui.Cond.FirstUseEver);
    ImGui.Begin("Debug menu", [false], ImGui.WindowFlags.MenuBar);

    this.renderMenuBar();
    ImGui.TextWrapped("This menu is for development and testing purposes.");
    this.renderUISettings();

    ImGui.End();
  }

  private renderMenuBar(): void {
    if (ImGui.BeginMenuBar()) {
      if (ImGui.BeginMenu("Inspectors")) {
        if (ImGui.MenuItem("Event queue", "E")) {
          this.toggleWindow("event");
        }
        if (ImGui.MenuItem("Screen", "S")) {
          this.toggleWindow("screen");
        }
        ImGui.EndMenu();
      }
      ImGui.EndMenuBar();
    }
  }

  private toggleWindow(type: "screen" | "event") {
    if (type === "screen") {
      this.screenInspectorWindow.toggle();
    } else if (type === "event") {
      this.eventInspectorWindow.toggle();
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
