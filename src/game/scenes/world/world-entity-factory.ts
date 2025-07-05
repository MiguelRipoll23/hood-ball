import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { WorldBackgroundEntity } from "../../entities/backgrounds/world-background-entity.js";
import { GoalEntity } from "../../entities/goal-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";
import { ToastEntity } from "../../entities/common/toast-entity.js";
import { BoostPadEntity } from "../../entities/boost-pad-entity.js";
import { BoostMeterEntity } from "../../entities/boost-meter-entity.js";
import { ButtonEntity } from "../../entities/common/button-entity.js";
import { getConfigurationKey } from "../../utils/configuration-utils.js";
import { SCOREBOARD_SECONDS_DURATION } from "../../constants/configuration-constants.js";
import type { GameState } from "../../../core/models/game-state.js";
import type { GameEntity } from "../../../core/models/game-entity.js";

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

  public createBackground(worldEntities: GameEntity[]): void {
    const backgroundEntity = new WorldBackgroundEntity(this.canvas);
    worldEntities.push(backgroundEntity);

    backgroundEntity.getCollisionHitboxes().forEach((obj) => {
      worldEntities.push(obj);
    });
  }

  public createWorldEntities(
    worldEntities: GameEntity[],
    uiEntities: GameEntity[]
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

    // Boost related entities
    const boostMeterEntity = new BoostMeterEntity(this.canvas);
    const boostButtonEntity = new ButtonEntity(this.canvas, "Boost");
    boostButtonEntity.setPosition(
      this.canvas.width - 80,
      this.canvas.height - 80
    );
    localCarEntity.setBoostButtonEntity(boostButtonEntity);
    localCarEntity.setBoostMeterEntity(boostMeterEntity);

    const padOffset = 60;
    const boostPads = [
      new BoostPadEntity(padOffset, padOffset),
      new BoostPadEntity(this.canvas.width - padOffset, padOffset),
      new BoostPadEntity(padOffset, this.canvas.height - padOffset),
      new BoostPadEntity(this.canvas.width - padOffset, this.canvas.height - padOffset),
    ];

    worldEntities.push(
      scoreboardEntity,
      ballEntity,
      goalEntity,
      localCarEntity,
      toastEntity,
      ...boostPads
    );
    uiEntities.push(
      alertEntity,
      localCarEntity.getJoystickEntity(),
      boostButtonEntity,
      boostMeterEntity
    );

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
