import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameEntity } from "../../interfaces/entities/game-entity.js";
import type { GameScreen } from "../../interfaces/screens/game-screen.js";
import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { RemoteCarEntity } from "../../entities/remote-car-entity.js";
import { BaseWindow } from "./base-window.js";
import type { GameState } from "../../core/services/game-state.js";

export class ScreenInspectorWindow extends BaseWindow {
  constructor(private gameState: GameState) {
    super("Screen inspector", new ImVec2(300, 350));
    console.log(`${this.constructor.name} created`);
  }

  protected override renderContent(): void {
    const screen = this.gameState.getGameFrame().getCurrentScreen();
    const subScreen =
      screen?.getScreenManagerService()?.getCurrentScreen() ?? null;

    const mainUI = screen?.getUIObjects() ?? [];
    const mainScene = screen?.getSceneObjects() ?? [];
    const subUI = subScreen?.getUIObjects() ?? [];
    const subScene = subScreen?.getSceneObjects() ?? [];

    if (ImGui.BeginTabBar("##ObjectsTabBar")) {
      if (ImGui.BeginTabItem("UI")) {
        this.renderScreenSections(screen, subScreen, mainUI, subUI, "ui");
        ImGui.EndTabItem();
      }
      if (ImGui.BeginTabItem("Scene")) {
        this.renderScreenSections(
          screen,
          subScreen,
          mainScene,
          subScene,
          "scene"
        );
        ImGui.EndTabItem();
      }
      ImGui.EndTabBar();
    }
  }

  private renderScreenSections(
    screen: GameScreen | null,
    subScreen: GameScreen | null,
    mainObjects: GameEntity[],
    subObjects: GameEntity[],
    idPrefix: string
  ): void {
    ImGui.SeparatorText(screen ? screen.constructor.name : "No screen");
    this.renderObjectList(mainObjects, `${idPrefix}_main`);

    ImGui.SeparatorText(
      subScreen ? subScreen.constructor.name : "No sub-screen"
    );

    this.renderObjectList(subObjects, `${idPrefix}_sub`);
  }

  private renderObjectList(objects: GameEntity[], idPrefix: string): void {
    if (objects.length === 0) {
      ImGui.Text("No objects found in this screen.");
      return;
    }

    objects.forEach((obj, index) => {
      this.renderObjectDetails(obj, `${idPrefix}${index}`);
    });
  }

  private renderObjectDetails(object: GameEntity, uniqueId: string): void {
    const headerId = `${object.constructor.name}##${uniqueId}`;
    if (!ImGui.CollapsingHeader(headerId)) return;

    this.renderObjectActions(object, uniqueId);

    Object.keys(object)
      .sort()
      .forEach((key) => {
        try {
          const value = (object as any)[key];
          if (typeof value !== "function" && typeof value !== "object") {
            ImGui.Text(`${key}: ${String(value)}`);
          }
        } catch {
          // Skip inaccessible properties
        }
      });
  }

  private renderObjectActions(object: GameEntity, uniqueId: string): void {
    if (object instanceof BaseAnimatedGameEntity) {
      if (ImGui.Button(`Teleport##${uniqueId}`)) {
        const canvasWidth = this.gameState.getCanvas().width;
        const canvasHeight = this.gameState.getCanvas().height;
        const x = 25 + Math.random() * (canvasWidth - 25);
        const y = 25 + Math.random() * (canvasHeight - 25);
        object.setX(x);
        object.setY(y);
      }

      ImGui.SameLine();

      if (ImGui.Button(`Reset##${uniqueId}`)) {
        object.reset();
      }

      ImGui.SameLine();
    }

    if (ImGui.Button(`Remove##${uniqueId}`)) {
      object.setRemoved(true);
    }

    this.renderCustomObjectActions(object, uniqueId);
  }

  private renderCustomObjectActions(object: GameEntity, uniqueId: string) {
    if (object instanceof BallEntity) {
      this.renderBallEntityActions(object, uniqueId);
    } else if (object instanceof RemoteCarEntity) {
      this.renderRemoteCarEntityActions(object, uniqueId);
    }
  }

  private renderBallEntityActions(object: BallEntity, uniqueId: string): void {
    if (ImGui.Button(`Duplicate##${uniqueId}`)) {
      const x = object.getX();
      const y = object.getY() - object.getHeight() * 2;

      const ballObject = new BallEntity(x, y, this.gameState.getCanvas());
      ballObject.setId(crypto.randomUUID().replaceAll("-", ""));
      ballObject.setDebugSettings(this.gameState.getDebugSettings());
      ballObject.setVY(5);
      ballObject.load();

      const currentScreen = this.gameState.getGameFrame().getCurrentScreen();

      if (currentScreen) {
        currentScreen.getSceneObjects().push(ballObject);
      }
    }
  }

  private renderRemoteCarEntityActions(
    object: RemoteCarEntity,
    uniqueId: string
  ): void {
    if (ImGui.Button(`Duplicate##${uniqueId}`)) {
      const x = object.getX();
      const y = object.getY() - object.getHeight() * 2;
      const angle = object.getAngle();

      const remoteCarEntity = new RemoteCarEntity(
        crypto.randomUUID().replaceAll("-", ""),
        x,
        y,
        angle,
        0
      );

      remoteCarEntity.setDebugSettings(this.gameState.getDebugSettings());
      remoteCarEntity.setOwner(this.gameState.getGamePlayer());

      remoteCarEntity.setVY(5);

      const currentScreen = this.gameState.getGameFrame().getCurrentScreen();

      if (currentScreen) {
        currentScreen.getSceneObjects().push(remoteCarEntity);
      }
    }
  }
}
