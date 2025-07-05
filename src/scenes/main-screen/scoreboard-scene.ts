import type { RankingResponse } from "../../interfaces/responses/ranking-response.js";
import { BaseGameScene } from "../../core/scenes/base-game-scene.js";
import type { GameState } from "../../core/services/game-state.js";
import { APIService } from "../../services/network/api-service.js";
import { injectable } from "@needle-di/core";
import { container } from "../../core/services/di-container.js";
import { EventConsumerService } from "../../core/services/event-consumer-service.js";
import { ScoreboardEntityFactory } from "./scoreboard-entity-factory.js";
import type { ScoreboardEntities } from "./scoreboard-entity-factory.js";
import { ScoreboardController } from "./scoreboard-controller.js";

@injectable()
export class ScoreboardScene extends BaseGameScene {
  private objects: ScoreboardEntities | null = null;
  private controller: ScoreboardController;

  constructor(
    gameState: GameState,
    eventConsumerService: EventConsumerService,
    apiService: APIService = container.get(APIService)
  ) {
    super(gameState, eventConsumerService);
    this.controller = new ScoreboardController(apiService);
  }

  public override load(): void {
    const factory = new ScoreboardEntityFactory(this.canvas);
    this.objects = factory.createObjects();

    const { title, button, rankingTable, closeableMessage } = this.objects;
    this.uiEntities.push(title, button, rankingTable, closeableMessage);
    super.load();
  }

  public override onTransitionEnd(): void {
    super.onTransitionEnd();
    this.fetchRanking();
  }


  private fetchRanking(): void {
    this.controller
      .fetchRanking()
      .then((ranking) => {
        this.setRankingData(ranking);
        this.objects?.rankingTable.fadeIn(0.2);
      })
      .catch((error) => {
        console.error("Failed to fetch ranking", error);
        this.objects?.closeableMessage.show("Failed to fetch ranking");
      });
  }

  private setRankingData(ranking: RankingResponse[]): void {
    this.objects?.rankingTable.setRanking(ranking);
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.objects?.button.isPressed()) {
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
    this.returnToPreviousScreen();
  }
}
