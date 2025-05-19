import { GameController } from "../../models/game-controller.js";
import { ButtonObject } from "../../objects/common/button-object.js";
import { TitleObject } from "../../objects/common/title-object.js";
import type { RankingResponse } from "../../interfaces/response/ranking-response.js";
import { BaseGameScreen } from "../base/base-game-screen.js";
import { CloseableMessageObject } from "../../objects/common/closeable-message-object.js";
import { RankingTableObject } from "../../objects/ranking-table-object.js";

export class ScoreboardScreen extends BaseGameScreen {
  private titleObject: TitleObject | null = null;
  private buttonObject: ButtonObject | null = null;
  private rankingTableObject: RankingTableObject | null = null;
  private closeableMessageObject: CloseableMessageObject | null = null;

  constructor(gameController: GameController) {
    super(gameController);
  }

  public override load(): void {
    this.loadTitleObject();
    this.loadButtonObject();
    this.loadRankingTableObject();
    this.loadCloseableMessageObject();
    super.load();
  }

  public override hasTransitionFinished(): void {
    super.hasTransitionFinished();
    this.fetchRanking();
  }

  private loadTitleObject(): void {
    this.titleObject = new TitleObject();
    this.titleObject.setText("SCOREBOARD");
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

  private loadRankingTableObject(): void {
    this.rankingTableObject = new RankingTableObject();
    this.uiObjects.push(this.rankingTableObject);
  }

  private loadCloseableMessageObject(): void {
    this.closeableMessageObject = new CloseableMessageObject(this.canvas);
    this.uiObjects.push(this.closeableMessageObject);
  }

  private fetchRanking(): void {
    const apiService = this.gameController.getAPIService();
    apiService
      .getRanking()
      .then((ranking) => {
        this.setRankingData(ranking);
        this.rankingTableObject?.fadeIn(0.2);
      })
      .catch((error) => {
        console.error("Failed to fetch ranking", error);
        this.closeableMessageObject?.show("Failed to fetch ranking");
      });
  }

  private setRankingData(ranking: RankingResponse[]): void {
    this.rankingTableObject?.setRanking(ranking);
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
