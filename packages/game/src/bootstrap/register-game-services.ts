import { ENGINE_WEBRTC_SERVICE_TOKEN } from "@engine/services/events/event-tokens.js";
import { EventProcessorService } from "@engine/services/events/event-processor-service.js";
import { EventConsumerService } from "@engine/services/events/event-consumer-service.js";
import { SceneTransitionService } from "@engine/services/scene/scene-transition-service.js";
import { TimerManagerService } from "@engine/services/time/timer-manager-service.js";
import { IntervalManagerService } from "@engine/services/time/interval-manager-service.js";
import { EngineLoopService } from "@engine/loop/engine-loop-service.js";
import { ENGINE_CONTEXT_TOKEN } from "@engine/state/engine-context.js";
import type { EngineContext } from "@engine/state/engine-context.js";
import { EVENT_IDENTIFIER_RESOLVER_TOKEN } from "@engine/contracts/events/event-identifier.js";
import { WEBRTC_COMMAND_MAP_TOKEN } from "@engine/contracts/network/webrtc-command-map.js";
import { EventType } from "../enums/event-type.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import { APIService } from "../services/network/api-service.js";
import { ChatService } from "../services/network/chat-service.js";
import { MatchmakingNetworkService } from "../services/network/matchmaking-network-service.js";
import { WebSocketService } from "../services/network/websocket-service.js";
import { WebSocketDispatcherService } from "../services/network/websocket-dispatcher-service.js";
import { WebSocketReconnectionManager } from "../services/network/websocket-reconnection-manager.js";
import { WebRTCService } from "../services/network/webrtc-service.js";
import { WebRTCDispatcherService } from "../services/network/webrtc-dispatcher-service.js";
import { EventNetworkBridge } from "../services/network/event-network-bridge.js";
import { MatchFinderService } from "../services/gameplay/match-finder-service.js";
import { MatchmakingService } from "../services/gameplay/matchmaking-service.js";
import { MatchLifecycleService } from "../services/gameplay/match-lifecycle-service.js";
import { DisconnectionMonitor } from "../services/gameplay/disconnection-monitor.js";
import { MatchmakingCoordinator } from "../services/gameplay/matchmaking-coordinator.js";
import { EntityOrchestratorService } from "../services/gameplay/entity-orchestrator-service.js";
import { SpawnPointService } from "../services/gameplay/spawn-point-service.js";
import { MatchActionsLogService } from "../services/gameplay/match-actions-log-service.js";
import { LoadingIndicatorService } from "../services/ui/loading-indicator-service.js";
import { GameSceneProvider } from "../services/ui/game-scene-provider.js";
import { GameLoopFacade } from "../loop/game-loop-facade.js";
import { GameLoopPipeline } from "../loop/game-loop-pipeline.js";
import { CredentialService } from "../services/security/credential-service.js";
import { CryptoService } from "../services/security/crypto-service.js";
import {
  PendingIdentitiesToken,
  ReceivedIdentitiesToken,
  type PendingIdentityMap,
  type ReceivedIdentityMap,
} from "../services/gameplay/matchmaking-tokens.js";
import { GameState } from "../state/game-state.js";
import { DebugService } from "../services/debug/debug-service.js";
import { WebRTCPeerRegistry } from "../services/network/webrtc-peer-registry.js";
import { WebRTCDebugOverlay } from "../services/network/webrtc-debug-overlay.js";
import { PlayerAssignmentService } from "../services/gameplay/player-assignment-service.js";
import { MatchmakingEventPublisher } from "../services/gameplay/matchmaking-event-publisher.js";

type ValueProvider = {
  provide: unknown;
  useValue: unknown;
};

type ClassProvider = {
  provide: unknown;
  useClass: new (...args: never[]) => unknown;
};

type ExistingProvider = {
  provide: unknown;
  useExisting: unknown;
};

type FactoryProvider = {
  provide: unknown;
  useFactory: (container: ContainerContract) => unknown;
};

type ContainerContract = {
  get: <T>(token: unknown) => T;
  has?: (token: unknown) => boolean;
};

export interface BindableContainer {
  bind: (
    provider: ClassProvider | ValueProvider | ExistingProvider | FactoryProvider
  ) => unknown;
}

export function registerGameServices(container: BindableContainer): void {
  container.bind({ provide: APIService, useClass: APIService });
  container.bind({ provide: CryptoService, useClass: CryptoService });
  container.bind({ provide: CredentialService, useClass: CredentialService });
  container.bind({ provide: LoadingIndicatorService, useClass: LoadingIndicatorService });
  container.bind({ provide: GameSceneProvider, useClass: GameSceneProvider });
  container.bind({ provide: MatchFinderService, useClass: MatchFinderService });
  container.bind({ provide: MatchmakingNetworkService, useClass: MatchmakingNetworkService });
  container.bind({ provide: MatchmakingService, useClass: MatchmakingService });
  container.bind({ provide: MatchLifecycleService, useClass: MatchLifecycleService });
  container.bind({ provide: DisconnectionMonitor, useClass: DisconnectionMonitor });
  container.bind({ provide: EntityOrchestratorService, useClass: EntityOrchestratorService });
  container.bind({ provide: SpawnPointService, useClass: SpawnPointService });
  container.bind({ provide: MatchActionsLogService, useClass: MatchActionsLogService });
  container.bind({ provide: DebugService, useClass: DebugService });
  container.bind({ provide: PlayerAssignmentService, useClass: PlayerAssignmentService });
  container.bind({ provide: MatchmakingEventPublisher, useClass: MatchmakingEventPublisher });
  container.bind({ provide: WebSocketDispatcherService, useClass: WebSocketDispatcherService });
  container.bind({ provide: WebSocketReconnectionManager, useClass: WebSocketReconnectionManager });
  container.bind({ provide: WebRTCPeerRegistry, useClass: WebRTCPeerRegistry });
  container.bind({ provide: WebRTCDispatcherService, useClass: WebRTCDispatcherService });

  container.bind({
    provide: WebRTCDebugOverlay,
    useFactory: (target) => new WebRTCDebugOverlay(target.get(GameState)),
  });

  container.bind({
    provide: WebSocketService,
    useFactory: (target) =>
      new WebSocketService(
        target.get(GameState),
        target.get(WebSocketDispatcherService),
        target.get(WebSocketReconnectionManager)
      ),
  });

  container.bind({
    provide: WebRTCService,
    useFactory: (target) =>
      new WebRTCService(
        target.get(GameState),
        target.get(WebSocketService),
        target.get(TimerManagerService),
        target.get(WebRTCDispatcherService),
        target.get(WebRTCPeerRegistry),
        target.get(WebRTCDebugOverlay)
      ),
  });

  container.bind({
    provide: EventNetworkBridge,
    useFactory: (target) =>
      new EventNetworkBridge(
        target.get(EventProcessorService),
        target.get(WebRTCService),
        target.get(WebSocketService),
        target.get(WEBRTC_COMMAND_MAP_TOKEN),
        target.get(GameState)
      ),
  });

  container.bind({
    provide: MatchmakingCoordinator,
    useFactory: (target) =>
      new MatchmakingCoordinator(
        target.get(WebRTCService),
        target.get(MatchmakingService)
      ),
  });

  container.bind({
    provide: GameLoopPipeline,
    useFactory: (target) =>
      new GameLoopPipeline(target.get(GameState), {
        engineContext: target.get(ENGINE_CONTEXT_TOKEN) as EngineContext,
        eventConsumerService: target.get(EventConsumerService),
        sceneTransitionService: target.get(SceneTransitionService),
        timerManagerService: target.get(TimerManagerService),
        intervalManagerService: target.get(IntervalManagerService),
        sceneProvider: target.get(GameSceneProvider),
        matchmakingService: target.get(MatchmakingService),
        matchmakingCoordinator: target.get(MatchmakingCoordinator),
        webrtcService: target.get(WebRTCService),
        eventNetworkBridge: target.get(EventNetworkBridge),
        debugService: target.get(DebugService),
      }),
  });

  container.bind({
    provide: GameLoopFacade,
    useFactory: (target) =>
      new GameLoopFacade(
        target.get(EngineLoopService),
        target.get(GameLoopPipeline)
      ),
  });

  container.bind({ provide: ENGINE_WEBRTC_SERVICE_TOKEN, useExisting: WebRTCService });
  container.bind({ provide: ChatService, useClass: ChatService });

  container.bind({
    provide: EVENT_IDENTIFIER_RESOLVER_TOKEN,
    useValue: {
      getName: (eventId: number) => (EventType as unknown as Record<number, string>)[eventId] ?? null,
    },
  });

  container.bind({
    provide: WEBRTC_COMMAND_MAP_TOKEN,
    useValue: { eventData: WebRTCType.EventData },
  });

  const pendingIdentities: PendingIdentityMap = new Map();
  const receivedIdentities: ReceivedIdentityMap = new Map();

  container.bind({ provide: PendingIdentitiesToken, useValue: pendingIdentities });
  container.bind({ provide: ReceivedIdentitiesToken, useValue: receivedIdentities });
}
