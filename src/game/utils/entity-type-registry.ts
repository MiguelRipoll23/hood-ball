import { EntityRegistry } from "../../engine/services/entity-registry.js";
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

/**
 * Register all game entity types for recording/playback
 * This is called once during game initialization
 *
 * Note: Some entities require optional dependencies (input handlers, ball references)
 * which are omitted during replay. Entities handle missing dependencies gracefully.
 */
export function registerGameEntityTypes(canvas: HTMLCanvasElement): void {
  // Register core gameplay entities
  EntityRegistry.register("BallEntity", () => new BallEntity(0, 0, canvas));

  // Register car entities with their actual classes
  // Note: LocalCarEntity ignores input handlers when undefined (replay mode)
  EntityRegistry.register(
    "LocalCarEntity",
    () => new LocalCarEntity(0, 0, 0, canvas)
  );
  EntityRegistry.register(
    "RemoteCarEntity",
    () => new RemoteCarEntity("", 0, 0, 0, 0, false, 100)
  );
  EntityRegistry.register(
    "CarEntity",
    () => new RemoteCarEntity("", 0, 0, 0, 0, false, 100)
  );
  EntityRegistry.register(
    "NpcCarEntity",
    () => new NpcCarEntity(0, 0, 0, canvas)
  );

  EntityRegistry.register("GoalEntity", () => new GoalEntity(canvas));
  EntityRegistry.register(
    "GoalExplosionEntity",
    () => new GoalExplosionEntity(canvas, 0, 0, 0)
  );
  EntityRegistry.register(
    "CarExplosionEntity",
    () => new CarExplosionEntity(0, 0)
  );

  // Boost pads need index, but for replay we can use 0 as placeholder
  EntityRegistry.register("BoostPadEntity", () => new BoostPadEntity(0, 0, 0));

  // UI Entities
  EntityRegistry.register(
    "ScoreboardEntity",
    () => new ScoreboardEntity(canvas)
  );
  EntityRegistry.register("AlertEntity", () => new AlertEntity(canvas));
  EntityRegistry.register("ToastEntity", () => new ToastEntity(canvas));
  EntityRegistry.register("HelpEntity", () => new HelpEntity(canvas));
  EntityRegistry.register("MatchLogEntity", () => new MatchLogEntity(canvas));
  EntityRegistry.register(
    "BoostMeterEntity",
    () => new BoostMeterEntity(canvas)
  );

  // Skip ChatButtonEntity - requires too many dependencies for replay

  // Background
  EntityRegistry.register(
    "WorldBackgroundEntity",
    () => new WorldBackgroundEntity(canvas)
  );

  console.log(
    `Registered ${
      EntityRegistry.getRegisteredTypes().length
    } entity types for recording playback`
  );
}
