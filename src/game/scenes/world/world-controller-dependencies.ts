import type { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import type { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import type { BaseMultiplayerGameEntity } from "../../../engine/entities/base-multiplayer-entity.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import type { ScoreboardEntity } from "../../entities/scoreboard-entity.js";
import type { BallEntity } from "../../entities/ball-entity.js";
import type { LocalCarEntity } from "../../entities/local-car-entity.js";
import type { AlertEntity } from "../../entities/alert-entity.js";
import type { BoostPadEntity } from "../../entities/boost-pad-entity.js";
import type { SpawnPointEntity } from "../../entities/common/spawn-point-entity.js";
import type { GamePlayer } from "../../models/game-player.js";
import type { SpawnPointService } from "../../services/gameplay/spawn-point-service.js";
import type { MatchActionsLogService } from "../../services/gameplay/match-actions-log-service.js";
import type { NpcService } from "../../services/gameplay/npc-service.js";
import type { MatchSessionService } from "../../services/session/match-session-service.js";

export interface WorldControllerDependencies {
  spawnPointService: SpawnPointService;
  timerManagerService: TimerManagerService;
  eventProcessorService: EventProcessorService;
  matchmakingService: MatchmakingServiceContract;
  scoreboardEntity: ScoreboardEntity;
  ballEntity: BallEntity;
  localCarEntity: LocalCarEntity;
  alertEntity: AlertEntity;
  matchActionsLogService: MatchActionsLogService;
  boostPadsEntities: BoostPadEntity[];
  spawnPointEntities: SpawnPointEntity[];
  getEntitiesByOwner: (player: GamePlayer) => BaseMultiplayerGameEntity[];
  npcService: NpcService;
  gamePlayer: GamePlayer;
  matchSessionService: MatchSessionService;
}
