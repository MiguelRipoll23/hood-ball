import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { WorldBackgroundEntity } from "../../entities/backgrounds/world-background-entity.js";
import { GoalEntity } from "../../entities/goal-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";
import { ToastEntity } from "../../entities/common/toast-entity.js";
import { HelpEntity } from "../../entities/help-entity.js";
import { BoostPadEntity } from "../../entities/boost-pad-entity.js";
import { BoostMeterEntity } from "../../entities/boost-meter-entity.js";
import { getConfigurationKey } from "../../utils/configuration-utils.js";
import { SCOREBOARD_SECONDS_DURATION } from "../../constants/configuration-constants.js";
import type { GameState } from "../../../core/models/game-state.js";
import type { GameEntity } from "../../../core/models/game-entity.js";
import { SpawnPointEntity } from "../../entities/common/spawn-point-entity.js";

export interface WorldEntities {
  scoreboardEntity: ScoreboardEntity;
  localCarEntity: LocalCarEntity;
  ballEntity: BallEntity;
  goalEntity: GoalEntity;
  alertEntity: AlertEntity;
  toastEntity: ToastEntity;
  helpEntity: HelpEntity;
  boostPadsEntities: BoostPadEntity[];
  spawnPointEntities: SpawnPointEntity[];
}

export class WorldEntityFactory {
  // === Constants ===
  private static readonly INITIAL_CAR_X = 0;
  private static readonly INITIAL_CAR_Y = 0;
  private static readonly INITIAL_CAR_ROTATION = Math.PI / 2;

  private static readonly BOOST_PAD_OFFSET = 60;
  private static readonly DEFAULT_SCOREBOARD_DURATION = 60;

  private static readonly SPAWN_BASE_Y_OFFSET = 160;
  private static readonly SPAWN_HORIZONTAL_SPACING = 90;
  private static readonly SPAWN_VERTICAL_SPACING = 80;

  constructor(
    private readonly gameState: GameState,
    private readonly canvas: HTMLCanvasElement
  ) {}

  public createBackground(worldEntities: GameEntity[]): void {
    const backgroundEntity = new WorldBackgroundEntity(this.canvas);
    worldEntities.push(
      backgroundEntity,
      ...backgroundEntity.getCollisionHitboxes()
    );
  }

  public createWorldEntities(
    worldEntities: GameEntity[],
    uiEntities: GameEntity[]
  ): WorldEntities {
    const scoreboardEntity = this.createScoreboardEntity();
    const spawnPointEntities = this.createSpawnPointEntities();
    const { localCarEntity, boostMeterEntity } = this.createLocalCarEntity();
    const ballEntity = this.createBallEntity();
    const goalEntity = new GoalEntity(this.canvas);
    const boostPadsEntities = this.createBoostPadEntities();
    const { alertEntity, toastEntity, helpEntity } = this.createUIEntities();

    worldEntities.push(
      scoreboardEntity,
      ballEntity,
      goalEntity,
      ...boostPadsEntities,
      localCarEntity,
      toastEntity,
      ...spawnPointEntities
    );

    uiEntities.push(
      alertEntity,
      localCarEntity.getJoystickEntity(),
      boostMeterEntity,
      helpEntity
    );

    return {
      scoreboardEntity,
      localCarEntity,
      ballEntity,
      goalEntity,
      alertEntity,
      toastEntity,
      helpEntity,
      boostPadsEntities,
      spawnPointEntities,
    };
  }

  // === Private Methods ===

  private createScoreboardEntity(): ScoreboardEntity {
    const duration = getConfigurationKey<number>(
      SCOREBOARD_SECONDS_DURATION,
      WorldEntityFactory.DEFAULT_SCOREBOARD_DURATION,
      this.gameState
    );
    const scoreboard = new ScoreboardEntity(this.canvas);
    scoreboard.setTimerDuration(duration);
    return scoreboard;
  }

  private createBallEntity(): BallEntity {
    const ball = new BallEntity(0, 0, this.canvas);
    ball.setCenterPosition();
    return ball;
  }

  private createLocalCarEntity(): {
    localCarEntity: LocalCarEntity;
    boostMeterEntity: BoostMeterEntity;
  } {
    const pointer = this.gameState.getGamePointer();
    const keyboard = this.gameState.getGameKeyboard();
    const gamepad = this.gameState.getGameGamepad();

    const car = new LocalCarEntity(
      WorldEntityFactory.INITIAL_CAR_X,
      WorldEntityFactory.INITIAL_CAR_Y,
      WorldEntityFactory.INITIAL_CAR_ROTATION,
      this.canvas,
      pointer,
      keyboard,
      gamepad
    );

    car.setOwner(this.gameState.getGamePlayer());

    const boostMeter = new BoostMeterEntity(this.canvas);
    car.setBoostMeterEntity(boostMeter);

    return { localCarEntity: car, boostMeterEntity: boostMeter };
  }

  private createBoostPadEntities(): BoostPadEntity[] {
    const offset = WorldEntityFactory.BOOST_PAD_OFFSET;
    const { width, height } = this.canvas;

    return [
      new BoostPadEntity(offset, offset, 0),
      new BoostPadEntity(width - offset, offset, 1),
      new BoostPadEntity(offset, height - offset, 2),
      new BoostPadEntity(width - offset, height - offset, 3),
    ];
  }

  private createSpawnPointEntities(): SpawnPointEntity[] {
    const centerX = this.canvas.width / 2;
    const baseY = this.canvas.height - WorldEntityFactory.SPAWN_BASE_Y_OFFSET;
    const h = WorldEntityFactory.SPAWN_HORIZONTAL_SPACING;
    const v = WorldEntityFactory.SPAWN_VERTICAL_SPACING;

    return [
      new SpawnPointEntity(0, centerX - h / 2, baseY - v),
      new SpawnPointEntity(1, centerX + h / 2, baseY - v),
      new SpawnPointEntity(2, centerX - h, baseY),
      new SpawnPointEntity(3, centerX + h, baseY),
    ];
  }

  private createUIEntities(): {
    alertEntity: AlertEntity;
    toastEntity: ToastEntity;
    helpEntity: HelpEntity;
  } {
    return {
      alertEntity: new AlertEntity(this.canvas),
      toastEntity: new ToastEntity(this.canvas),
      helpEntity: new HelpEntity(this.canvas),
    };
  }
}
