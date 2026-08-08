import type { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import type { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import type { BallEntity } from "../../entities/ball-entity.js";
import type { GoalEntity } from "../../entities/goal-entity.js";
import type { AlertEntity } from "../../entities/alert-entity.js";
import type { ScoreboardUI } from "../../interfaces/ui/scoreboard-ui-interface.js";
import type { MatchActionsLogService } from "./match-actions-log-service.js";
import type { TeamType } from "../../enums/team-type.js";
import type { GamePlayer } from "../../models/game-player.js";
import type { MatchSessionService } from "../session/match-session-service.js";

export interface ScoreManagerServiceDependencies {
  ballEntity: BallEntity;
  goalEntity: GoalEntity;
  scoreboardUI: ScoreboardUI;
  alertEntity: AlertEntity;
  matchActionsLogService: MatchActionsLogService;
  timerManagerService: TimerManagerService;
  eventProcessorService: EventProcessorService;
  matchmakingService: MatchmakingServiceContract;
  goalTimeEndCallback: () => void;
  gameOverEndCallback: () => void;
  explosionCallback: (x: number, y: number, team: TeamType) => void;
  gameOverEffectCallback: (won: boolean) => void;
  gamePlayer: GamePlayer;
  matchSessionService: MatchSessionService;
}
