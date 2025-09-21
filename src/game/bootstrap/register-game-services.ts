import { ENGINE_WEBRTC_SERVICE_TOKEN } from "@engine/services/events/event-tokens.js";
import { APIService } from "../services/network/api-service.js";
import { ChatService } from "../services/network/chat-service.js";
import { MatchmakingNetworkService } from "../services/network/matchmaking-network-service.js";
import { WebRTCService } from "../services/network/webrtc-service.js";
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
import { CredentialService } from "../services/security/credential-service.js";
import { CryptoService } from "../services/security/crypto-service.js";
import { EVENT_IDENTIFIER_RESOLVER_TOKEN } from "@engine/contracts/events/event-identifier.js";
import { WEBRTC_COMMAND_MAP_TOKEN } from "@engine/contracts/network/webrtc-command-map.js";
import { EventType } from "../enums/event-type.js";
import { WebRTCType } from "../enums/webrtc-type.js";
import {
  PendingIdentitiesToken,
  ReceivedIdentitiesToken,
  type PendingIdentityMap,
  type ReceivedIdentityMap,
} from "../services/gameplay/matchmaking-tokens.js";

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

export interface BindableContainer {
  bind: (provider: ClassProvider | ValueProvider | ExistingProvider) => unknown;
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
  container.bind({ provide: MatchmakingCoordinator, useClass: MatchmakingCoordinator });
  container.bind({ provide: EntityOrchestratorService, useClass: EntityOrchestratorService });
  container.bind({ provide: WebRTCService, useClass: WebRTCService });
  container.bind({ provide: ENGINE_WEBRTC_SERVICE_TOKEN, useExisting: WebRTCService });
  container.bind({ provide: ChatService, useClass: ChatService });
  container.bind({ provide: SpawnPointService, useClass: SpawnPointService });
  container.bind({ provide: MatchActionsLogService, useClass: MatchActionsLogService });
  container.bind({ provide: GameLoopFacade, useClass: GameLoopFacade });
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


