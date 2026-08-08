import type { GameState } from "../../../engine/models/game-state.js";
import type { EventConsumerService } from "../../../engine/services/gameplay/event-consumer-service.js";
import type { SceneTransitionService } from "../../../engine/services/gameplay/scene-transition-service.js";
import type { TimerManagerService } from "../../../engine/services/gameplay/timer-manager-service.js";
import type { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import type { MatchmakingServiceContract } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import type { MatchmakingControllerContract } from "../../interfaces/services/gameplay/matchmaking-controller-contract-interface.js";
import type { EntityOrchestratorService } from "../../services/gameplay/entity-orchestrator-service.js";
import type { SpawnPointService } from "../../services/gameplay/spawn-point-service.js";
import type { ChatService } from "../../services/network/chat-service.js";
import type { MatchActionsLogService } from "../../services/gameplay/match-actions-log-service.js";
import type { GamePlayer } from "../../models/game-player.js";
import type { GameServer } from "../../models/game-server.js";
import type { MatchSessionService } from "../../services/session/match-session-service.js";

export interface WorldSceneDependencies {
  gameState: GameState;
  eventConsumerService: EventConsumerService;
  sceneTransitionService: SceneTransitionService;
  timerManagerService: TimerManagerService;
  matchmakingService: MatchmakingServiceContract | null;
  matchmakingController: MatchmakingControllerContract | null;
  entityOrchestrator: EntityOrchestratorService | null;
  eventProcessorService: EventProcessorService;
  spawnPointService: SpawnPointService | null;
  chatService: ChatService | null;
  matchActionsLogService: MatchActionsLogService | null;
  gamePlayer: GamePlayer;
  gameServer: GameServer;
  matchSessionService: MatchSessionService;
  replayMode?: boolean;
}
