import { LocalCarEntity } from "../../entities/local-car-entity.js";
import { WorldBackgroundEntity } from "../../entities/backgrounds/world-background-entity.js";
import { GoalEntity } from "../../entities/goal-entity.js";
import { BallEntity } from "../../entities/ball-entity.js";
import { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import { AlertEntity } from "../../entities/alert-entity.js";
import { ToastEntity } from "../../entities/common/toast-entity.js";
import { getConfigurationKey } from "../../utils/configuration-utils.js";
import { SCOREBOARD_SECONDS_DURATION } from "../../constants/configuration-constants.js";
import type { GameState } from "../../core/services/game-state.js";

export interface WorldObjects {
  scoreboard: ScoreboardEntity;
  localCar: LocalCarEntity;
  ball: BallEntity;
  goal: GoalEntity;
  alert: AlertEntity;
  toast: ToastEntity;
}

export class WorldEntityFactory {
  constructor(
    private readonly gameState: GameState,
    private readonly canvas: HTMLCanvasElement
  ) {}

  public createBackground(sceneObjects: any[]): void {
    const backgroundObject = new WorldBackgroundEntity(this.canvas);
    sceneObjects.push(backgroundObject);

    backgroundObject.getCollisionHitboxes().forEach((obj) => {
      sceneObjects.push(obj);
    });
  }

  public createWorldObjects(
    sceneObjects: any[],
    uiObjects: any[]
  ): WorldObjects {
    const durationSeconds: number = getConfigurationKey<number>(
      SCOREBOARD_SECONDS_DURATION,
      60,
      this.gameState
    );

    const scoreboardObject = new ScoreboardEntity(this.canvas);
    scoreboardObject.setTimerDuration(durationSeconds);

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
    localCarEntity.setCanvas(this.canvas);
    localCarEntity.setCenterPosition();

    const ballObject = new BallEntity(0, 0, this.canvas);
    ballObject.setCenterPosition();

    const goalObject = new GoalEntity(this.canvas);

    const alertObject = new AlertEntity(this.canvas);
    const toastObject = new ToastEntity(this.canvas);

    sceneObjects.push(
      scoreboardObject,
      ballObject,
      goalObject,
      localCarEntity,
      toastObject
    );
    uiObjects.push(alertObject, localCarEntity.getJoystickEntity());

    return {
      scoreboard: scoreboardObject,
      localCar: localCarEntity,
      ball: ballObject,
      goal: goalObject,
      alert: alertObject,
      toast: toastObject,
    };
  }
}
