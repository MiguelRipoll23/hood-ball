import type { GameState } from "../../models/game-state.js";
import { ButtonObject } from "../../objects/common/button-object.js";
import { TitleObject } from "../../objects/common/title-object.js";
import { SettingObject } from "../../objects/setting-object.js";
import { DebugService } from "../../services/debug-service.js";
import { ServiceLocator } from "../../services/service-locator.js";
import { BaseGameScreen } from "../base/base-game-screen.js";

export class SettingsScreen extends BaseGameScreen {
  private titleObject: TitleObject | null = null;
  private buttonObject: ButtonObject | null = null;

  constructor(gameState: GameState) {
    super(gameState);
  }

  public override load(): void {
    this.loadTitleObject();
    this.loadButtonObject();
    this.loadSettingObjects();
    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();
  }

  private loadTitleObject(): void {
    this.titleObject = new TitleObject();
    this.titleObject.setText("SETTINGS");
    this.uiObjects.push(this.titleObject);
  }

  public loadButtonObject(): void {
    this.buttonObject = new ButtonObject(this.canvas, "Back");
    this.buttonObject.setPosition(
      this.canvas.width / 2,
      this.canvas.height - 60 - 20
    );
    this.uiObjects.push(this.buttonObject);
  }

  private loadSettingObjects(): void {
    this.loadDebugSettingObject();
  }

  private loadDebugSettingObject(): void {
    const debugging = this.gameState.isDebugging();
    const settingObject = new SettingObject("debug", "Debug", debugging);

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
      if (object instanceof SettingObject) {
        if (object.getUpdated()) {
          this.handleSettingObjectPress(object);
          object.setUpdated(false);
        }
      }
    });
  }

  private returnMainMenu(): void {
    const previousScreen =
      this.screenManagerService?.getPreviousScreen() ?? null;

    if (previousScreen === null) {
      return;
    }

    console.log("Returning to", previousScreen.constructor.name);

    this.screenManagerService
      ?.getTransitionService()
      .crossfade(previousScreen, 0.2);
  }

  private handleSettingObjectPress(settingObject: SettingObject): void {
    const id = settingObject.getSettingId();

    switch (id) {
      case "debug":
        return this.handleDebugSettingPress(settingObject);

      default:
        console.log("Unknown setting pressed");
        break;
    }
  }

  private handleDebugSettingPress(settingObject: SettingObject): void {
    const state = settingObject.getSettingState();
    this.gameState.getDebugSettings().setDebugging(state);

    // Update UI if debugging state changes
    this.updateDebugStateForObjects();

    if (state === false) {
      const debugService = ServiceLocator.get(DebugService);
      debugService.stop();
      return;
    }

    // Initialize debug service if not already initialized
    const debugService = ServiceLocator.get(DebugService);

    if (debugService.isInitialized() === false) {
      debugService.init();
    }
  }
}
