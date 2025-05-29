import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameObject } from "../interfaces/object/game-object";
import type { GameScreen } from "../interfaces/screen/game-screen";
import type { GameController } from "../models/game-controller";
import { BaseAnimatedGameObject } from "../objects/base/base-animated-object";
import { BallObject } from "../objects/ball-object";
import { RemoteCarObject } from "../objects/remote-car-object";

export class ScreenInspectorWindow {
  private readonly INITIAL_POSITION_X = window.innerWidth - 400;
  private readonly INITIAL_POSITION_Y = window.innerHeight - 500;

  constructor(private gameController: GameController) {
    console.log(`${this.constructor.name} created`);
  }

  public render(): void {
    ImGui.SetNextWindowPos(
      new ImVec2(this.INITIAL_POSITION_X, this.INITIAL_POSITION_Y),
      ImGui.Cond.FirstUseEver
    );

    ImGui.SetNextWindowSize(new ImVec2(300, 350), ImGui.Cond.FirstUseEver);
    ImGui.Begin("Screen inspector");

    const screen = this.gameController.getGameFrame().getCurrentScreen();
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

    ImGui.End();
  }

  private renderScreenSections(
    screen: GameScreen | null,
    subScreen: GameScreen | null,
    mainObjects: GameObject[],
    subObjects: GameObject[],
    idPrefix: string
  ): void {
    ImGui.SeparatorText(screen ? screen.constructor.name : "No screen");
    this.renderObjectList(mainObjects, `${idPrefix}_main`);

    ImGui.SeparatorText(
      subScreen ? subScreen.constructor.name : "No sub-screen"
    );
    this.renderObjectList(subObjects, `${idPrefix}_sub`);
  }

  private renderObjectList(objects: GameObject[], idPrefix: string): void {
    if (objects.length === 0) {
      ImGui.Text("No objects found in this screen.");
      return;
    }

    objects.forEach((obj, index) => {
      this.renderObjectDetails(obj, `${idPrefix}${index}`);
    });
  }

  private renderObjectDetails(object: GameObject, uniqueId: string): void {
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

  private renderObjectActions(object: GameObject, uniqueId: string): void {
    if (object instanceof BaseAnimatedGameObject) {
      if (ImGui.Button(`Teleport##${uniqueId}`)) {
        const canvasWidth = this.gameController.getCanvas().width;
        const canvasHeight = this.gameController.getCanvas().height;
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

  private renderCustomObjectActions(object: GameObject, uniqueId: string) {
    if (object instanceof BallObject) {
      this.renderBallObjectActions(object, uniqueId);
    } else if (object instanceof RemoteCarObject) {
      this.renderRemoteCarObjectActions(object, uniqueId);
    }
  }

  private renderBallObjectActions(object: BallObject, uniqueId: string): void {
    if (ImGui.Button(`Duplicate##${uniqueId}`)) {
      const x = object.getX();
      const y = object.getY() - object.getHeight() * 2;

      const ballObject = new BallObject(x, y, this.gameController.getCanvas());
      ballObject.setId(crypto.randomUUID().replaceAll("-", ""));
      ballObject.setDebug(true);
      ballObject.setVY(5);
      ballObject.load();

      this.gameController
        .getGameFrame()
        .getCurrentScreen()
        ?.getSceneObjects()
        .push(ballObject);
    }
  }

  private renderRemoteCarObjectActions(
    object: RemoteCarObject,
    uniqueId: string
  ): void {
    if (ImGui.Button(`Duplicate##${uniqueId}`)) {
      const x = object.getX();
      const y = object.getY() - object.getHeight() * 2;
      const angle = object.getAngle();

      const remoteCarObject = new RemoteCarObject(
        crypto.randomUUID().replaceAll("-", ""),
        x,
        y,
        angle,
        0
      );

      remoteCarObject.setDebug(true);
      remoteCarObject.setOwner(
        this.gameController.getGameState().getGamePlayer()
      );
      remoteCarObject.setVY(5);
      remoteCarObject.load();

      this.gameController
        .getGameFrame()
        .getCurrentScreen()
        ?.getSceneObjects()
        .push(remoteCarObject);
    }
  }
}
