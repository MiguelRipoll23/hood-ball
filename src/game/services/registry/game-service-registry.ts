import { container } from "../../../engine/services/di-container.js";
import { MatchmakingService } from "../gameplay/matchmaking-service.js";
import { EntityOrchestratorService } from "../gameplay/entity-orchestrator-service.js";
import { WebRTCService } from "../network/webrtc-service.js";
import { WebSocketService } from "../network/websocket-service.js";
import { APIService } from "../network/api-service.js";
import { LoadingIndicatorService } from "../ui/loading-indicator-service.js";
import { MatchFinderService } from "../gameplay/match-finder-service.js";
import { MatchmakingNetworkService } from "../network/matchmaking-network-service.js";
import { MatchLifecycleService } from "../gameplay/match-lifecycle-service.js";
import { DisconnectionMonitor } from "../gameplay/disconnection-monitor.js";
import { CredentialService } from "../security/credential-service.js";
import { AntiCheatService } from "../security/anti-cheat-service.js";
import { AntiCheatMonitorService } from "../security/anti-cheat-monitor-service.js";
import { AntiCheatReportingService } from "../security/anti-cheat-reporting-service.js";
import { SpawnPointService } from "../gameplay/spawn-point-service.js";
import { ChatService } from "../network/chat-service.js";
import { PlayerModerationService } from "../network/player-moderation-service.js";
import { MatchmakingControllerService } from "../gameplay/matchmaking-controller-service.js";
import { MatchActionsLogService } from "../gameplay/match-actions-log-service.js";
import { GamePlayer } from "../../models/game-player.js";
import { GameServer } from "../../models/game-server.js";
import { MatchSessionService } from "../session/match-session-service.js";
import { GameLifecycleService } from "../lifecycle/game-lifecycle-service.js";
import { CryptoService } from "../security/crypto-service.js";
import { EventProcessorService } from "../../../engine/services/gameplay/event-processor-service.js";
import { WEB_SOCKET_SERVICE_TOKEN } from "../../interfaces/services/network/websocket-service-interface.js";
import { API_SERVICE_TOKEN } from "../../interfaces/services/network/api-contract-interface.js";
import { MATCHMAKING_SERVICE_TOKEN } from "../../interfaces/services/matchmaking/matchmaking-service-contract-interface.js";
import { MATCHMAKING_NETWORK_SERVICE_TOKEN } from "../../interfaces/services/matchmaking/matchmaking-network-service-contract-interface.js";
import { MATCHMAKING_CONTROLLER_TOKEN } from "../../interfaces/services/gameplay/matchmaking-controller-contract-interface.js";
import { WORLD_SCENE_FACTORY_TOKEN } from "../../../engine/interfaces/services/gameplay/world-scene-factory-contract.js";
import { WorldSceneFactory } from "../../scenes/world/world-scene-factory.js";
import { WEB_RTC_SERVICE_TOKEN } from "../../../engine/interfaces/services/network/webrtc-service-contract.js";
import { WebRTCEventDispatcher } from "../network/webrtc-event-dispatcher.js";
import { EngineLogger } from "../../../engine/services/engine-logger.js";

export class GameServiceRegistry {
  public static register(): void {
    container.bind(GamePlayer);
    container.bind(GameServer);
    container.bind(MatchSessionService);
    container.bind(GameLifecycleService);
    container.bind(CryptoService);

    container.bind({ provide: APIService, useClass: APIService });
    container.bind({
      provide: LoadingIndicatorService,
      useClass: LoadingIndicatorService,
    });
    container.bind({
      provide: MatchFinderService,
      useClass: MatchFinderService,
    });
    container.bind({
      provide: MatchmakingNetworkService,
      useClass: MatchmakingNetworkService,
    });
    container.bind({
      provide: MatchmakingService,
      useClass: MatchmakingService,
    });
    container.bind({
      provide: MatchLifecycleService,
      useClass: MatchLifecycleService,
    });
    container.bind({
      provide: DisconnectionMonitor,
      useClass: DisconnectionMonitor,
    });
    container.bind({
      provide: EntityOrchestratorService,
      useClass: EntityOrchestratorService,
    });
    container.bind({ provide: WebRTCService, useClass: WebRTCService });
    container.bind({ provide: ChatService, useClass: ChatService });
    container.bind({
      provide: PlayerModerationService,
      useClass: PlayerModerationService,
    });
    container.bind({ provide: SpawnPointService, useClass: SpawnPointService });
    container.bind({
      provide: MatchActionsLogService,
      useClass: MatchActionsLogService,
    });
    container.bind({ provide: CredentialService, useClass: CredentialService });
    container.bind({
      provide: AntiCheatReportingService,
      useClass: AntiCheatReportingService,
    });
    container.bind({
      provide: AntiCheatMonitorService,
      useClass: AntiCheatMonitorService,
    });
    container.bind({
      provide: AntiCheatService,
      useClass: AntiCheatService,
    });

    // Contract tokens resolve to the same singleton instances
    container.bind({
      provide: WEB_SOCKET_SERVICE_TOKEN,
      useExisting: WebSocketService,
    });
    container.bind({
      provide: WEB_RTC_SERVICE_TOKEN,
      useExisting: WebRTCService,
    });
    container.bind({
      provide: API_SERVICE_TOKEN,
      useExisting: APIService,
    });
    container.bind({
      provide: MATCHMAKING_SERVICE_TOKEN,
      useExisting: MatchmakingService,
    });
    container.bind({
      provide: MATCHMAKING_NETWORK_SERVICE_TOKEN,
      useExisting: MatchmakingNetworkService,
    });
    container.bind({
      provide: MATCHMAKING_CONTROLLER_TOKEN,
      useExisting: MatchmakingControllerService,
    });
    container.bind({
      provide: WorldSceneFactory,
      useClass: WorldSceneFactory,
    });
    container.bind({
      provide: WORLD_SCENE_FACTORY_TOKEN,
      useExisting: WorldSceneFactory,
    });
    GameServiceRegistry.initializeServices();
  }

  private static initializeServices() {
    try {
      const webrtcService: WebRTCService = container.get(WebRTCService);
      const websocketService: WebSocketService =
        container.get(WebSocketService);
      // Eagerly construct the matchmaking graph (network, finder, lifecycle)
      container.get(MatchmakingService);
      const matchmakingNetworkService: MatchmakingNetworkService =
        container.get(MatchmakingNetworkService);
      const entityOrchestratorService: EntityOrchestratorService =
        container.get(EntityOrchestratorService);
      const eventProcessorService: EventProcessorService =
        container.get(EventProcessorService);
      const chatService: ChatService = container.get(ChatService);
      const antiCheatService: AntiCheatService =
        container.get(AntiCheatService);

      // Single composition root: register all cross-service command handlers
      websocketService.registerCommandHandlers(matchmakingNetworkService);
      websocketService.registerCommandHandlers(chatService);
      websocketService.registerCommandHandlers(antiCheatService);
      webrtcService.registerCommandHandlers(matchmakingNetworkService);
      webrtcService.registerCommandHandlers(chatService);

      // Break runtime dependency cycles via late initialization
      eventProcessorService.setWebRTCService(webrtcService);
      entityOrchestratorService.initialize(webrtcService);
      webrtcService.initialize(matchmakingNetworkService);

      // Register WebRTC event dispatcher (decouples engine from WebRTC protocol)
      const eventDispatcher = new WebRTCEventDispatcher(eventProcessorService);
      eventDispatcher.register(webrtcService);
    } catch (error) {
      EngineLogger.error("GameServiceRegistry", "Error initializing services", error);
    }
  }
}
