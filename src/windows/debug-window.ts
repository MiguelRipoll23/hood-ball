import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameController } from "../models/game-controller";
import { ScreenInspectorWindow } from "./screen-inspector-window";

export class DebugWindow {
  private screenInspectorWindow: ScreenInspectorWindow | null = null;

  private showScreenInspectorWindow = false;
  private showEventsWindow = false;

  constructor(private gameController: GameController) {
    console.log(`${this.constructor.name} created`);
    this.loadScreenInspectorWindow();
  }

  public render(): void {
    this.renderMainMenu();

    if (this.showScreenInspectorWindow) {
      this.screenInspectorWindow?.render();
    }
  }

  private loadScreenInspectorWindow(): void {
    this.screenInspectorWindow = new ScreenInspectorWindow(this.gameController);
  }

  private renderMainMenu(): void {
    ImGui.SetNextWindowSize(new ImVec2(200, 250), ImGui.Cond.FirstUseEver);
    ImGui.Begin("Debug menu");
    ImGui.TextWrapped("This menu is for development and testing purposes.");

    if (ImGui.CollapsingHeader("Window", ImGui.TreeNodeFlags.DefaultOpen)) {
      ImGui.Checkbox("Placeholder 1", [false]);
    }

    if (ImGui.CollapsingHeader("Game", ImGui.TreeNodeFlags.DefaultOpen)) {
      ImGui.Checkbox("Placeholder 2", [true]);
      ImGui.SeparatorText("Inspectors");
      if (ImGui.Button("Events")) this.toggleWindow("events");
      ImGui.SameLine();
      if (ImGui.Button("Objects")) this.toggleWindow("objects");
    }

    ImGui.End();
  }

  private toggleWindow(window: "objects" | "events"): void {
    this[
      window === "objects" ? "showScreenInspectorWindow" : "showEventsWindow"
    ] =
      !this[
        window === "objects" ? "showScreenInspectorWindow" : "showEventsWindow"
      ];
  }
}
