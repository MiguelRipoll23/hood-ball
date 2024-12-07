import { GameController } from "../../models/game-controller.js";
import { ButtonObject } from "../../objects/common/button-object.js";
import { TitleObject } from "../../objects/common/title-object.js";
import { ToggleObject } from "../../objects/common/toggle-button.js";
import { BaseGameScreen } from "../base/base-game-screen.js";

export class SettingsScreen extends BaseGameScreen {
  private titleObject: TitleObject | null = null;
  private buttonObject: ButtonObject | null = null;

  constructor(gameController: GameController) {
    super(gameController);
  }

  public override loadObjects(): void {
    this.loadTitleObject();
    this.loadButtonObject();
    this.loadToggleObjects();
    super.loadObjects();
  }

  public override hasTransitionFinished(): void {
    super.hasTransitionFinished();
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

  private loadToggleObjects(): void {
    const toggleObject = new ToggleObject("debug");
    toggleObject.setY(100);
    this.uiObjects.push(toggleObject);
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.buttonObject?.isPressed()) {
      this.returnMainMenu();
    }

    super.update(deltaTimeStamp);
  }

  public override render(context: CanvasRenderingContext2D): void {
    context.save();
    super.render(context);
    context.restore();
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
}
