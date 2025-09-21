import { createEngineContainer } from "../src/engine/bootstrap/engine-container.js";
import { EventProcessorService } from "../src/engine/services/events/event-processor-service.js";
import { ENGINE_WEBRTC_SERVICE_TOKEN } from "../src/engine/services/events/event-tokens.js";
import { ENGINE_CONTEXT_TOKEN } from "../src/engine/state/engine-context.js";
import { EVENT_IDENTIFIER_RESOLVER_TOKEN } from "../src/engine/contracts/events/event-identifier.js";
import { WEBRTC_COMMAND_MAP_TOKEN } from "../src/engine/contracts/network/webrtc-command-map.js";
import type { EngineContext } from "../src/engine/state/engine-context.js";
import type { WebRTCServiceContract } from "../src/game/interfaces/services/network/webrtc-service-interface.js";
import { MatchmakingCoordinator } from "../src/game/services/gameplay/matchmaking-coordinator.js";
import type { WebRTCPeer } from "../src/game/interfaces/services/network/webrtc-peer.js";
import type { BinaryReader } from "../src/core/utils/binary-reader-utils.js";

class MockWebRTCService implements WebRTCServiceContract {
  public readonly registeredHandlers = new Set<object>();
  public readonly boundCommands = new Map<number, (peer: WebRTCPeer, reader: BinaryReader) => void>();
  public connectionListener: object | null = null;

  public registerCommandHandlers(instance: object): void {
    this.registeredHandlers.add(instance);
  }

  public bindCommandHandler(
    commandId: number,
    handler: (peer: WebRTCPeer, reader: BinaryReader) => void
  ): void {
    this.boundCommands.set(commandId, handler);
  }

  public dispatchCommand(): void {}

  public sendIceCandidate(): void {}

  public removePeer(): void {}

  public getPeers(): never[] {
    return [];
  }

  public setConnectionListener(listener: object): void {
    this.connectionListener = listener;
  }
}

class MockMatchmakingService {
  public readonly networkService = {};

  public getNetworkService(): object {
    return this.networkService;
  }
}

const mockCanvas = {
  width: 1920,
  height: 1080,
  style: {},
  getContext: () => ({
    clearRect: () => undefined,
    beginPath: () => undefined,
    arc: () => undefined,
    closePath: () => undefined,
    fill: () => undefined,
    fillRect: () => undefined,
    save: () => undefined,
    restore: () => undefined,
  }),
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }),
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
} as unknown as HTMLCanvasElement;

const mockEngineContext: EngineContext = {
  getCanvas: () => mockCanvas,
  getGameFrame: () => ({} as never),
  getGamePointer: () => ({} as never),
  getGameKeyboard: () => ({} as never),
  getGameGamepad: () => ({} as never),
  isDebugging: () => false,
};

const container = createEngineContainer();
const webRTCService = new MockWebRTCService();

container.bind({ provide: ENGINE_CONTEXT_TOKEN, useValue: mockEngineContext });
container.bind({ provide: ENGINE_WEBRTC_SERVICE_TOKEN, useValue: webRTCService });
container.bind({
  provide: EVENT_IDENTIFIER_RESOLVER_TOKEN,
  useValue: { getName: (eventId: number) => `event-${eventId}` },
});
container.bind({
  provide: WEBRTC_COMMAND_MAP_TOKEN,
  useValue: { eventData: 42 },
});

const eventProcessor = container.get(EventProcessorService);

if (!webRTCService.registeredHandlers.has(eventProcessor)) {
  throw new Error("EventProcessorService was not registered with the WebRTC service");
}

if (!webRTCService.boundCommands.has(42)) {
  throw new Error("EventProcessorService did not bind the WebRTC event data handler");
}

const resolvedWebRTC = Reflect.get(
  eventProcessor as unknown as Record<string, unknown>,
  "webrtcService"
);
if (resolvedWebRTC !== webRTCService) {
  throw new Error("EventProcessorService did not receive WebRTC dependency via constructor");
}

const matchmakingService = new MockMatchmakingService();

new MatchmakingCoordinator(
  webRTCService as unknown as any,
  matchmakingService as unknown as any
);

if (webRTCService.connectionListener !== matchmakingService.networkService) {
  throw new Error("MatchmakingCoordinator did not eagerly wire the WebRTC connection listener");
}

console.log("Dependency injection wiring verified successfully.");
