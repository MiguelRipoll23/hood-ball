import { ImGui, ImVec2 } from "@mori2003/jsimgui";
import type { GameEntity } from "../../core/models/game-entity.js";
import type { GameScene } from "../../core/interfaces/scenes/game-scene.js";
import { BaseAnimatedGameEntity } from "../../core/entities/base-animated-entity.js";
import { BallEntity } from "../entities/ball-entity.js";
import { RemoteCarEntity } from "../entities/remote-car-entity.js";
import { BaseWindow } from "../../core/debug/base-window.js";
import type { GameState } from "../../core/models/game-state.js";
import type { ISceneManagerService } from "../interfaces/services/ui/scene-manager-service-interface.js";
import { MainScene } from "../scenes/main/main-scene.js";
import { MainMenuScene } from "../scenes/main/main-menu/main-menu-scene.js";
import { SceneTransitionService } from "../../core/services/gameplay/scene-transition-service.js";
import { EventConsumerService } from "../../core/services/gameplay/event-consumer-service.js";
import { WebSocketService } from "../services/network/websocket-service.js";
import { container } from "../../core/services/di-container.js";

export class SceneInspectorWindow extends BaseWindow {
  private static readonly COLOR_CURRENT_SCENE = 0xffffff00; // Yellow

  constructor(private gameState: GameState) {
    super("Scene inspector", new ImVec2(300, 350));
    console.log(`${this.constructor.name} created`);
  }

  protected override renderContent(): void {
    const scene = this.gameState.getGameFrame().getCurrentScene();
    const subScene = scene?.getSceneManagerService()?.getCurrentScene() ?? null;

    const mainSceneUIEntities = scene?.getUIEntities() ?? [];
    const mainSceneWorldEntities = scene?.getWorldEntities() ?? [];
    const subSceneUIEntities = subScene?.getUIEntities() ?? [];
    const subSceneWorldEntities = subScene?.getWorldEntities() ?? [];

    if (ImGui.BeginTabBar("##EntitiesTabBar")) {
      if (ImGui.BeginTabItem("UI")) {
        this.renderSceneSections(
          scene,
          subScene,
          mainSceneUIEntities,
          subSceneUIEntities,
          "ui"
        );
        ImGui.EndTabItem();
      }
      if (ImGui.BeginTabItem("World")) {
        this.renderSceneSections(
          scene,
          subScene,
          mainSceneWorldEntities,
          subSceneWorldEntities,
          "world"
        );
        ImGui.EndTabItem();
      }
      if (ImGui.BeginTabItem("Stack")) {
        this.renderStackTab(scene);
        ImGui.EndTabItem();
      }
      ImGui.EndTabBar();
    }
  }

  private renderSceneSections(
    scene: GameScene | null,
    subScene: GameScene | null,
    mainEntities: GameEntity[],
    subEntities: GameEntity[],
    idPrefix: string
  ): void {
    ImGui.Text(scene ? scene.constructor.name : "No scene");
    this.renderEntityList(mainEntities, `${idPrefix}_main`);

    ImGui.Text(subScene ? subScene.constructor.name : "No sub-scene");

    this.renderEntityList(subEntities, `${idPrefix}_sub`);
  }

  private renderEntityList(entities: GameEntity[], idPrefix: string): void {
    if (entities.length === 0) {
      ImGui.Text("No entities found in this scene.");
      return;
    }

    entities.forEach((obj, index) => {
      this.renderEntityDetails(obj, `${idPrefix}${index}`);
    });
  }

  private renderEntityDetails(entity: GameEntity, uniqueId: string): void {
    const headerId = `${entity.constructor.name}##${uniqueId}`;
    if (!ImGui.CollapsingHeader(headerId)) return;

    this.renderEntityActions(entity, uniqueId);

    Object.keys(entity)
      .sort()
      .forEach((key) => {
        try {
          const value = (entity as any)[key];
          if (typeof value !== "function" && typeof value !== "object") {
            ImGui.Text(`${key}: ${String(value)}`);
          }
        } catch {
          // Skip inaccessible properties
        }
      });
  }

  private renderEntityActions(entity: GameEntity, uniqueId: string): void {
    if (entity instanceof BaseAnimatedGameEntity) {
      if (ImGui.Button(`Teleport##${uniqueId}`)) {
        const canvasWidth = this.gameState.getCanvas().width;
        const canvasHeight = this.gameState.getCanvas().height;
        const x = 25 + Math.random() * (canvasWidth - 25);
        const y = 25 + Math.random() * (canvasHeight - 25);
        entity.setX(x);
        entity.setY(y);
      }

      ImGui.SameLine();

      if (ImGui.Button(`Reset##${uniqueId}`)) {
        entity.reset();
      }

      ImGui.SameLine();
    }

    if (ImGui.Button(`Remove##${uniqueId}`)) {
      entity.setRemoved(true);
    }

    this.renderCustomEntityActions(entity, uniqueId);
  }

  private renderCustomEntityActions(entity: GameEntity, uniqueId: string) {
    if (entity instanceof BallEntity) {
      this.renderBallEntityActions(entity, uniqueId);
    } else if (entity instanceof RemoteCarEntity) {
      this.renderRemoteCarEntityActions(entity, uniqueId);
    }
  }

  private renderBallEntityActions(entity: BallEntity, uniqueId: string): void {
    if (ImGui.Button(`Duplicate##${uniqueId}`)) {
      const x = entity.getX();
      const y = entity.getY() - entity.getHeight() * 2;

      const ballEntity = new BallEntity(x, y, this.gameState.getCanvas());
      ballEntity.setId(crypto.randomUUID().replaceAll("-", ""));
      ballEntity.setDebugSettings(this.gameState.getDebugSettings());
      ballEntity.setVY(5);
      ballEntity.load();

      const currentScene = this.gameState.getGameFrame().getCurrentScene();

      if (currentScene) {
        currentScene.getWorldEntities().push(ballEntity);
      }
    }
  }

  private renderRemoteCarEntityActions(
    entity: RemoteCarEntity,
    uniqueId: string
  ): void {
    if (ImGui.Button(`Duplicate##${uniqueId}`)) {
      const x = entity.getX();
      const y = entity.getY() - entity.getHeight() * 2;
      const angle = entity.getAngle();

      const remoteCarEntity = new RemoteCarEntity(
        crypto.randomUUID().replaceAll("-", ""),
        x,
        y,
        angle,
        0,
        false,
        100
      );

      remoteCarEntity.setDebugSettings(this.gameState.getDebugSettings());
      remoteCarEntity.setOwner(this.gameState.getGamePlayer());

      remoteCarEntity.setVY(5);

      const currentScene = this.gameState.getGameFrame().getCurrentScene();

      if (currentScene) {
        currentScene.getWorldEntities().push(remoteCarEntity);
      }
    }
  }

  private renderStackTab(scene: GameScene | null): void {
    const sceneManager =
      (scene?.getSceneManagerService() as ISceneManagerService | null) ?? null;

    let scenes: GameScene[] = [];
    let currentIndex = -1;

    if (sceneManager) {
      scenes = sceneManager.getScenes();
      const currentScene = sceneManager.getCurrentScene();
      currentIndex = scenes.indexOf(currentScene as GameScene);

      const tableFlags =
        ImGui.TableFlags.Borders |
        ImGui.TableFlags.RowBg |
        ImGui.TableFlags.Resizable |
        ImGui.TableFlags.ScrollY |
        ImGui.TableFlags.SizingStretchProp;

      if (ImGui.BeginTable("SceneStackTable", 2, tableFlags, new ImVec2(0, 120))) {
        ImGui.TableSetupColumn("#", ImGui.TableColumnFlags.WidthFixed, 20);
        ImGui.TableSetupColumn("Scene", ImGui.TableColumnFlags.WidthStretch);
        ImGui.TableHeadersRow();

        scenes.forEach((s, idx) => {
          ImGui.TableNextRow();
          ImGui.TableSetColumnIndex(0);
          ImGui.Text(String(idx));
          ImGui.TableSetColumnIndex(1);
          const isCurrent = idx === currentIndex;
          if (isCurrent) {
            ImGui.PushStyleColor(
              ImGui.Col.Text,
              SceneInspectorWindow.COLOR_CURRENT_SCENE
            );
          }
          ImGui.Text(s.constructor.name);
          if (isCurrent) {
            ImGui.PopStyleColor();
          }
        });

        ImGui.EndTable();
      }
    } else {
      ImGui.Text("No scene manager");
    }

    if (ImGui.Button("Return to main menu")) {
      this.goToMainMenu();
    }
  }

  private goToMainMenu(): void {
    this.cleanupState();
    const mainScene = new MainScene(
      this.gameState,
      container.get(EventConsumerService)
    );
    const mainMenuScene = new MainMenuScene(
      this.gameState,
      container.get(EventConsumerService),
      false
    );

    if (!this.gameState.getGameServer().isConnected()) {
      try {
        container.get(WebSocketService).connectToServer();
      } catch (error) {
        console.error("Failed to reconnect to server", error);
      }
    }

    mainScene.activateScene(mainMenuScene);
    mainScene.load();

    container
      .get(SceneTransitionService)
      .fadeOutAndIn(this.gameState.getGameFrame(), mainScene, 1, 1);
  }

  private cleanupState(): void {
    this.gameState.setMatch(null);
    this.gameState.getGamePlayer().reset();
  }
}
