import type { GameState } from "../../core/services/game-state.js";
import { ButtonEntity } from "../../entities/common/button-entity.js";
import { TitleEntity } from "../../entities/common/title-entity.js";
import { SettingEntity } from "../../entities/setting-entity.js";
import { DebugService } from "../../debug/debug-service.js";
import { BaseGameScreen } from "../../core/scenes/base-game-screen.js";
import { container } from "../../core/services/di-container.js";
import { EventConsumerService } from "../../core/services/event-consumer-service.js";

export class SettingsScreen extends BaseGameScreen {
  private titleObject: TitleEntity | null = null;
  private buttonObject: ButtonEntity | null = null;

  constructor(gameState: GameState, eventConsumerService: EventConsumerService) {
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
    this.titleObject = new TitleEntity();
    this.titleObject.setText("SETTINGS");
    this.uiObjects.push(this.titleObject);
  }

  public loadButtonEntity(): void {
    this.buttonObject = new ButtonEntity(this.canvas, "Back");
    this.buttonObject.setPosition(
      this.canvas.width / 2,
      this.canvas.height - 60 - 20
    );
    this.uiObjects.push(this.buttonObject);
  }

  private loadSettingEntities(): void {
    this.loadDebugSettingEntity();
  }

  private loadDebugSettingEntity(): void {
    const debugging = this.gameState.isDebugging();
    const settingObject = new SettingEntity("debug", "Debug", debugging);

    settingObject.setY(75);
    settingObject.load();

    this.uiObjects.push(settingObject);
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    super.update(deltaTimeStamp);

    if (this.buttonObject?.isPressed()) {
      this.returnMainMenu();
    }

    this.uiObjects.forEach((object) => {
      if (object instanceof SettingEntity) {
        if (object.getUpdated()) {
          this.handleSettingEntityPress(object);
          object.setUpdated(false);
        }
      }
    });
  }

  private returnMainMenu(): void {
    this.returnToPreviousScreen();
  }

  private handleSettingEntityPress(settingObject: SettingEntity): void {
    const id = settingObject.getSettingId();

    switch (id) {
      case "debug":
        return this.handleDebugSettingPress(settingObject);

      default:
        console.log("Unknown setting pressed");
        break;
    }
  }

  private handleDebugSettingPress(settingObject: SettingEntity): void {
    const state = settingObject.getSettingState();
    this.gameState.getDebugSettings().setDebugging(state);

    // Update UI if debugging state changes
    this.updateDebugStateForObjects();

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
