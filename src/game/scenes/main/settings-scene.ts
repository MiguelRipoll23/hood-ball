import type { GameState } from "../../../engine/models/game-state.js";
import { ButtonEntity } from "../../entities/common/button-entity.js";
import { TitleEntity } from "../../entities/common/title-entity.js";
import { SettingEntity } from "../../entities/setting-entity.js";
import { DebugService } from "../../../engine/services/debug/debug-service.js";
import { BaseGameScene } from "../../../engine/scenes/base-game-scene.js";
import { container } from "../../../engine/services/di-container.js";
import { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import { DebugWindow } from "../../debug/debug-window.js";

export class SettingsScene extends BaseGameScene {
  private titleEntity: TitleEntity | null = null;
  private buttonEntity: ButtonEntity | null = null;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService
  ) {
    super(gameState, eventConsumerService);
  }

  public override load(): void {
    this.loadTitleEntity();
    this.loadButtonEntity();
    this.loadSettingEntities();
    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();
  }

  private loadTitleEntity(): void {
    this.titleEntity = new TitleEntity();
    this.titleEntity.setText("SETTINGS");
    this.uiEntities.push(this.titleEntity);
  }

  public loadButtonEntity(): void {
    this.buttonEntity = new ButtonEntity(this.canvas, "Back");
    this.buttonEntity.setPosition(
      this.canvas.width / 2,
      this.canvas.height - 60 - 20
    );
    this.uiEntities.push(this.buttonEntity);
  }

  private loadSettingEntities(): void {
    this.loadDebugSettingEntity();
    this.loadDebugToolsSettingEntity();
  }

  private loadDebugSettingEntity(): void {
    const debugging = this.gameState.isDebugging();
    const settingEntity = new SettingEntity("debug", "Debug mode", debugging);

    settingEntity.setY(75);
    settingEntity.load();

    this.uiEntities.push(settingEntity);
  }

  private loadDebugToolsSettingEntity(): void {
    // Only show debug tools setting when debug mode is enabled
    if (!this.gameState.isDebugging()) {
      return;
    }

    const debugToolsEnabled =
      this.gameState.getDebugSettings().isDebugToolsEnabled();
    const settingEntity = new SettingEntity(
      "debug-tools",
      "Show tools",
      debugToolsEnabled
    );

    settingEntity.setY(115);
    settingEntity.setIndented(true); // Indent to show hierarchy
    settingEntity.load();

    this.uiEntities.push(settingEntity);
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);

    if (this.buttonEntity?.isPressed()) {
      this.returnMainMenu();
    }

    this.uiEntities.forEach((entity) => {
      if (entity instanceof SettingEntity) {
        if (entity.getUpdated()) {
          this.handleSettingEntityPress(entity);
          entity.setUpdated(false);
        }
      }
    });
  }

  private returnMainMenu(): void {
    this.returnToPreviousScene();
  }

  private handleSettingEntityPress(settingEntity: SettingEntity): void {
    const id = settingEntity.getSettingId();

    switch (id) {
      case "debug":
        return this.handleDebugSettingPress(settingEntity);

      case "debug-tools":
        return this.handleDebugToolsSettingPress(settingEntity);

      default:
        console.log("Unknown setting pressed");
        break;
    }
  }

  private handleDebugSettingPress(settingEntity: SettingEntity): void {
    const state = settingEntity.getSettingState();
    this.gameState.getDebugSettings().setDebugging(state);

    // Update UI if debugging state changes
    this.updateDebugStateForEntities();

    // Reload the scene to update visibility of debug tools setting
    this.reloadScene();
  }

  private handleDebugToolsSettingPress(settingEntity: SettingEntity): void {
    const state = settingEntity.getSettingState();
    this.gameState.getDebugSettings().setDebugToolsEnabled(state);

    // Initialize debug service if not already initialized
    const debugService = container.get(DebugService);

    if (state === true) {
      if (debugService.isInitialized() === false) {
        debugService.init();
        // Register debug window only when first initializing
        const debugWindow = new DebugWindow(this.gameState);
        debugService.registerWindow(debugWindow);
      } else {
        // Re-open debug windows when debug tools is re-enabled
        debugService.openWindows();
      }
    } else {
      // Close debug windows when debug tools is disabled
      if (debugService.isInitialized()) {
        debugService.closeWindows();
      }
    }
  }

  private reloadScene(): void {
    // Clear entities and reload
    this.uiEntities.splice(0);
    this.load();
  }
}
