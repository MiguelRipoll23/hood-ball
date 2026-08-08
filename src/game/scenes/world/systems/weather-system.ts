import { SnowEntity } from "../../../entities/snow-entity.js";
import { CarEntity } from "../../../entities/car-entity.js";
import { BallEntity } from "../../../entities/ball-entity.js";
import type { GameEntity } from "../../../../engine/models/game-entity.js";
import type { GameScene } from "../../../../engine/interfaces/scenes/game-scene-interface.js";
import { EngineLogger } from "../../../../engine/services/engine-logger.js";

/**
 * Manages weather effects (snow) and their impact on game physics.
 * Extracted from WorldScene to reduce its size and improve cohesion.
 */
export class WeatherSystem {
  /** Friction multiplier applied during snow: 0.3 = 70% less friction (icy). */
  private static readonly SNOW_FRICTION_MULTIPLIER = 0.3;

  private activeWeatherEntity: SnowEntity | null = null;
  private weatherFrictionMultiplier = 1.0;

  /** Activate snow weather: spawns snow particles and makes surfaces icy. */
  public activateSnow(canvas: HTMLCanvasElement, scene: GameScene): void {
    if (this.activeWeatherEntity) {
      this.activeWeatherEntity.setRemoved(true);
    }

    const snowEntity = new SnowEntity(canvas);
    scene.addEntityToSceneLayer(snowEntity);
    this.activeWeatherEntity = snowEntity;

    this.weatherFrictionMultiplier = WeatherSystem.SNOW_FRICTION_MULTIPLIER;
    EngineLogger.info("WeatherSystem", "Snow weather activated - icy conditions!");
  }

  /**
   * Call each frame. Checks if the weather effect has ended and applies
   * weather-modified friction to all cars and the ball.
   */
  public update(worldEntities: GameEntity[]): void {
    if (this.activeWeatherEntity?.isRemoved()) {
      this.weatherFrictionMultiplier = 1.0;
      this.applyFriction(worldEntities);
      this.activeWeatherEntity = null;
      EngineLogger.info("WeatherSystem", "Weather effect ended - physics restored to normal");
    }

    if (this.weatherFrictionMultiplier !== 1.0) {
      this.applyFriction(worldEntities);
    }
  }

  /** Apply weather friction multiplier to all cars and the ball. */
  private applyFriction(worldEntities: GameEntity[]): void {
    for (const entity of worldEntities) {
      if (entity instanceof CarEntity || entity instanceof BallEntity) {
        entity.setWeatherFrictionMultiplier(this.weatherFrictionMultiplier);
      }
    }
  }

  /** Returns the current friction multiplier (1.0 = normal). */
  public getFrictionMultiplier(): number {
    return this.weatherFrictionMultiplier;
  }
}
