import type { GameState } from "../../../core/models/game-state.js";
import { ButtonEntity } from "../../entities/common/button-entity.js";
import { TitleEntity } from "../../entities/common/title-entity.js";
import { SettingEntity } from "../../entities/setting-entity.js";
import { DebugService } from "../../services/debug/debug-service.js";
import { BaseGameScene } from "../../../core/scenes/base-game-scene.js";
import { container } from "../../../core/services/di-container.js";
import { EventConsumerService } from "../../../core/services/gameplay/event-consumer-service.js";

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
  }

  private loadDebugSettingEntity(): void {
    const debugging = this.gameState.isDebugging();
    const settingEntity = new SettingEntity(
      "debug",
      "Enable debug mode",
      debugging
    );

    settingEntity.setY(75);
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

    if (state === false) {
      return;
    }

    // Initialize debug service if not already initialized
    const debugService = container.get(DebugService);

    if (debugService.isInitialized() === false) {
      debugService.init();
    }
  }

}
