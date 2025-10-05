import type { UserScore } from "../../../interfaces/responses/user-scores-response.js";
import { BaseGameScene } from "../../../../core/scenes/base-game-scene.js";
import type { GameState } from "../../../../core/models/game-state.js";
import { APIService } from "../../../services/network/api-service.js";
import { injectable } from "@needle-di/core";
import { container } from "../../../../core/services/di-container.js";
import { EventConsumerService } from "../../../../core/services/gameplay/event-consumer-service.js";
import { ScoreboardEntityFactory } from "./scoreboard-entity-factory.js";
import type { ScoreboardEntities } from "./scoreboard-entity-factory.js";
import { ScoreboardController } from "./scoreboard-controller.js";

@injectable()
export class ScoreboardScene extends BaseGameScene {
  private entities: ScoreboardEntities | null = null;
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
    this.entities = factory.createEntities();

    const {
      titleEntity,
      buttonEntity,
      rankingTableEntity,
      closeableMessageEntity,
    } = this.entities;

    this.uiEntities.push(
      titleEntity,
      buttonEntity,
      rankingTableEntity,
      closeableMessageEntity
    );

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
        this.entities?.rankingTableEntity.fadeIn(0.2);
      })
      .catch((error) => {
        console.error("Failed to fetch ranking", error);
        this.entities?.closeableMessageEntity.show("Failed to fetch ranking");
      });
  }

  private setRankingData(ranking: UserScore[]): void {
    this.entities?.rankingTableEntity.setRanking(ranking);
  }

  public override update(deltaTimeStamp: DOMHighResTimeStamp): void {
    if (this.entities?.buttonEntity.isPressed()) {
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
    this.returnToPreviousScene();
  }
}
