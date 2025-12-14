import { EntityRegistry } from "../../engine/services/entity-registry.js";
import { EntityRegistryType } from "../enums/entity-registry-type.js";
import { BallEntity } from "../entities/ball-entity.js";
import { LocalCarEntity } from "../entities/local-car-entity.js";
import { RemoteCarEntity } from "../entities/remote-car-entity.js";
import { NpcCarEntity } from "../entities/npc-car-entity.js";
import { GoalEntity } from "../entities/goal-entity.js";
import { GoalExplosionEntity } from "../entities/goal-explosion-entity.js";
import { CarExplosionEntity } from "../entities/car-explosion-entity.js";
import { BoostPadEntity } from "../entities/boost-pad-entity.js";
import { ScoreboardEntity } from "../entities/scoreboard-entity.js";
import { AlertEntity } from "../entities/alert-entity.js";
import { ToastEntity } from "../entities/common/toast-entity.js";
import { HelpEntity } from "../entities/help-entity.js";
import { MatchLogEntity } from "../entities/match-log-entity.js";
import { BoostMeterEntity } from "../entities/boost-meter-entity.js";
import { WorldBackgroundEntity } from "../entities/backgrounds/world-background-entity.js";
import type { GameEntity } from "../../engine/models/game-entity.js";

/**
 * Register all game entity types for recording/playback
 * This is called once during game initialization
 *
 * Note: Some entities require optional dependencies (input handlers, ball references)
 * which are omitted during replay. Entities handle missing dependencies gracefully.
 */
export function registerGameEntityTypes(canvas: HTMLCanvasElement): void {
  // Register core gameplay entities
  EntityRegistry.register(
    EntityRegistryType.Ball,
    () => new BallEntity(0, 0, canvas),
  );

  // Register car entities with their actual classes
  // Note: LocalCarEntity ignores input handlers when undefined (replay mode)
  EntityRegistry.register(
    EntityRegistryType.LocalCar,
    () => new LocalCarEntity(0, 0, 0, canvas),
  );

  EntityRegistry.register(
    EntityRegistryType.RemoteCar,
    () => new RemoteCarEntity("", 0, 0, 0, 0, false, 100),
  );

  EntityRegistry.register(
    EntityRegistryType.NpcCar,
    () => new NpcCarEntity(0, 0, 0, canvas),
  );

  EntityRegistry.register(
    EntityRegistryType.Goal,
    () => new GoalEntity(canvas),
  );

  EntityRegistry.register(
    EntityRegistryType.GoalExplosion,
    () => new GoalExplosionEntity(canvas, 0, 0, 0),
  );

  EntityRegistry.register(
    EntityRegistryType.CarExplosion,
    () => new CarExplosionEntity(0, 0),
  );

  // Boost pads need index, but for replay we can use 0 as placeholder
  EntityRegistry.register(
    EntityRegistryType.BoostPad,
    () => new BoostPadEntity(0, 0, 0),
  );

  // UI Entities
  EntityRegistry.register(
    EntityRegistryType.Scoreboard,
    () => new ScoreboardEntity(canvas),
  );

  EntityRegistry.register(
    EntityRegistryType.Alert,
    () => new AlertEntity(canvas),
  );

  EntityRegistry.register(
    EntityRegistryType.Toast,
    () => new ToastEntity(canvas),
  );

  EntityRegistry.register(
    EntityRegistryType.Help,
    () => new HelpEntity(canvas),
  );

  EntityRegistry.register(
    EntityRegistryType.MatchLog,
    () => new MatchLogEntity(canvas),
  );

  EntityRegistry.register(
    EntityRegistryType.BoostMeter,
    () => new BoostMeterEntity(canvas),
  );

  // Background
  EntityRegistry.register(
    EntityRegistryType.WorldBackground,
    () => new WorldBackgroundEntity(canvas),
  );

  console.log(
    `Registered ${EntityRegistry.getRegisteredTypes().length} entity types for recording playback`,
  );
}

/**
 * Returns a mapper function that uses EntityRegistry reverse lookup to determine entity types.
 * This mapper is injected into the recorder service to avoid engine->game dependencies.
 */
export function getEntityTypeMapper() {
  return (entity: GameEntity): number | null => {
    const type = entity.getTypeId();

    if (type === undefined) {
      // Do not log warning, some entities don't need recording
      return null;
    }

    return type;
  };
}
