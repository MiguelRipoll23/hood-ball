import { LocalCarObject } from "../../objects/local-car-object.js";
import { WorldBackgroundObject } from "../../objects/backgrounds/world-background-object.js";
import { GoalObject } from "../../objects/goal-object.js";
import { BallObject } from "../../objects/ball-object.js";
import { ScoreboardObject } from "../../objects/scoreboard-object.js";
import { AlertObject } from "../../objects/alert-object.js";
import { ToastObject } from "../../objects/common/toast-object.js";
import { getConfigurationKey } from "../../utils/configuration-utils.js";
import { SCOREBOARD_SECONDS_DURATION } from "../../constants/configuration-constants.js";
import type { GameState } from "../../core/services/game-state.js";

export interface WorldObjects {
  scoreboard: ScoreboardObject;
  localCar: LocalCarObject;
  ball: BallObject;
  goal: GoalObject;
  alert: AlertObject;
  toast: ToastObject;
}

export class WorldObjectFactory {
  constructor(
    private readonly gameState: GameState,
    private readonly canvas: HTMLCanvasElement
  ) {}

  public createBackground(sceneObjects: any[]): void {
    const backgroundObject = new WorldBackgroundObject(this.canvas);
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

    const scoreboardObject = new ScoreboardObject(this.canvas);
    scoreboardObject.setTimerDuration(durationSeconds);

    const gamePointer = this.gameState.getGamePointer();
    const gameKeyboard = this.gameState.getGameKeyboard();
    const gameGamepad = this.gameState.getGameGamepad();

    const localCarObject = new LocalCarObject(
      0,
      0,
      1.5708,
      this.canvas,
      gamePointer,
      gameKeyboard,
      gameGamepad
    );
    localCarObject.setOwner(this.gameState.getGamePlayer());
    localCarObject.setCanvas(this.canvas);
    localCarObject.setCenterPosition();

    const ballObject = new BallObject(0, 0, this.canvas);
    ballObject.setCenterPosition();

    const goalObject = new GoalObject(this.canvas);

    const alertObject = new AlertObject(this.canvas);
    const toastObject = new ToastObject(this.canvas);

    sceneObjects.push(
      scoreboardObject,
      ballObject,
      goalObject,
      localCarObject,
      toastObject
    );
    uiObjects.push(alertObject, localCarObject.getJoystickObject());

    return {
      scoreboard: scoreboardObject,
      localCar: localCarObject,
      ball: ballObject,
      goal: goalObject,
      alert: alertObject,
      toast: toastObject,
    };
  }
}
