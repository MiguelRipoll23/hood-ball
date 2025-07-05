import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { WorldBackgroundEntity } from "../../entities/backgrounds/world-background-entity.js";
import { GoalEntity } from "../../entities/goal-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";
import { ToastEntity } from "../../entities/common/toast-entity.js";
import { getConfigurationKey } from "../../utils/configuration-utils.js";
import { SCOREBOARD_SECONDS_DURATION } from "../../constants/configuration-constants.js";
import type { GameState } from "../../../core/models/game-state.js";

export interface WorldEntities {
  scoreboardEntity: ScoreboardEntity;
  localCarEntity: LocalCarEntity;
  ballEntity: BallEntity;
  goalEntity: GoalEntity;
  alertEntity: AlertEntity;
  toastEntity: ToastEntity;
}

export class WorldEntityFactory {
  constructor(
    private readonly gameState: GameState,
    private readonly canvas: HTMLCanvasElement
  ) {}

  public createBackground(worldEntities: any[]): void {
    const backgroundEntity = new WorldBackgroundEntity(this.canvas);
    worldEntities.push(backgroundEntity);

    backgroundEntity.getCollisionHitboxes().forEach((obj) => {
      worldEntities.push(obj);
    });
  }

  public createWorldEntities(
    worldEntities: any[],
    uiEntities: any[]
  ): WorldEntities {
    const durationSeconds: number = getConfigurationKey<number>(
      SCOREBOARD_SECONDS_DURATION,
      60,
      this.gameState
    );

    const scoreboardEntity = new ScoreboardEntity(this.canvas);
    scoreboardEntity.setTimerDuration(durationSeconds);

    const gamePointer = this.gameState.getGamePointer();
    const gameKeyboard = this.gameState.getGameKeyboard();
    const gameGamepad = this.gameState.getGameGamepad();

    const localCarEntity = new LocalCarEntity(
      0,
      0,
      1.5708,
      this.canvas,
      gamePointer,
      gameKeyboard,
      gameGamepad
    );
    localCarEntity.setOwner(this.gameState.getGamePlayer());
    localCarEntity.setCenterPosition();

    const ballEntity = new BallEntity(0, 0, this.canvas);
    ballEntity.setCenterPosition();

    const goalEntity = new GoalEntity(this.canvas);

    const alertEntity = new AlertEntity(this.canvas);
    const toastEntity = new ToastEntity(this.canvas);

    worldEntities.push(
      scoreboardEntity,
      ballEntity,
      goalEntity,
      localCarEntity,
      toastEntity
    );
    uiEntities.push(alertEntity, localCarEntity.getJoystickEntity());

    return {
      scoreboardEntity,
      localCarEntity,
      ballEntity,
      goalEntity,
      alertEntity,
      toastEntity,
    };
  }
}
