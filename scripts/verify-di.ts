import { createEngineContainer } from "../packages/engine/src/bootstrap/engine-container.js";
import { EventProcessorService } from "../packages/engine/src/services/events/event-processor-service.js";
import { ENGINE_CONTEXT_TOKEN } from "../packages/engine/src/state/engine-context.js";
import { EVENT_IDENTIFIER_RESOLVER_TOKEN } from "../packages/engine/src/contracts/events/event-identifier.js";
import type { EngineContext } from "../packages/engine/src/state/engine-context.js";
import { LocalEvent } from "../packages/core/src/models/local-event.js";
import { RemoteEvent } from "../packages/core/src/models/remote-event.js";
import { EventNetworkBridge } from "../packages/game/src/services/network/event-network-bridge.js";
import { MatchmakingCoordinator } from "../packages/game/src/services/gameplay/matchmaking-coordinator.js";
import { EventType } from "../packages/game/src/enums/event-type.js";
import type { WebRTCPeer } from "../packages/game/src/interfaces/services/network/webrtc-peer.js";
import { BinaryReader } from "../packages/engine/src/utils/binary-reader-utils.js";
import { BinaryWriter } from "../packages/engine/src/utils/binary-writer-utils.js";

class MockWebRTCService {
  public readonly registeredHandlers = new Set<object>();
  public readonly boundCommands = new Map<number, (peer: WebRTCPeer, reader: BinaryReader) => void>();
  public readonly peers: WebRTCPeer[] = [];
  public connectionListener: object | null = null;

  public registerCommandHandlers(instance: object): void {
    this.registeredHandlers.add(instance);
  }

  public bindCommandHandler(
    commandId: number,
    handler: (peer: WebRTCPeer, reader: BinaryReader) => void,
    _label?: string
  ): void {
    this.boundCommands.set(commandId, handler);
  }

  public getPeers(): WebRTCPeer[] {
    return this.peers;
  }

  public setConnectionListener(listener: object): void {
    this.connectionListener = listener;
  }
}

class MockWebSocketService {
  public readonly listeners: Array<(event: LocalEvent<unknown>) => void> = [];

  public addLocalEventListener(listener: (event: LocalEvent<unknown>) => void): void {
    this.listeners.push(listener);
  }

  public emit(event: LocalEvent<unknown>): void {
    this.listeners.forEach((listener) => listener(event));
  }
}

class MockWebRTCPeer {
  public lastPayload: ArrayBuffer | null = null;
  public joined = true;

  public hasJoined(): boolean {
    return this.joined;
  }

  public isHost(): boolean {
    return true;
  }

  public sendReliableOrderedMessage(payload: ArrayBuffer): void {
    this.lastPayload = payload;
  }

  // Unused interface methods
  public getConnectionState(): RTCPeerConnectionState {
    return "connected";
  }

  public isConnected(): boolean {
    return true;
  }

  public getToken(): string {
    return "mock-token";
  }

  public getPingRequestTime(): number | null {
    return null;
  }

  public getPingTime(): number | null {
    return null;
  }

  public setPingTime(): void {}

  public getName(): string {
    return "Mock";
  }

  public getPlayer(): null {
    return null;
  }

  public setPlayer(): void {}

  public setJoined(joined: boolean): void {
    this.joined = joined;
  }

  public disconnect(): void {}

  public disconnectGracefully(): void {}

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    return {};
  }

  public async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return {};
  }

  public async connect(): Promise<void> {}

  public addRemoteIceCandidate(): void {}

  public sendPingRequest(): void {}

  public sendReliableUnorderedMessage(): void {}

  public sendUnreliableUnorderedMessage(): void {}

  public getDownloadBytes(): number {
    return 0;
  }

  public getUploadBytes(): number {
    return 0;
  }

  public resetNetworkStats(): void {}
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

container.bind({ provide: ENGINE_CONTEXT_TOKEN, useValue: mockEngineContext });
container.bind({
  provide: EVENT_IDENTIFIER_RESOLVER_TOKEN,
  useValue: { getName: (eventId: number) => `event-${eventId}` },
});

const eventProcessor = container.get(EventProcessorService);

const webRtcService = new MockWebRTCService();
const webSocketService = new MockWebSocketService();
const webRtcCommands = { eventData: 42 };

new EventNetworkBridge(
  eventProcessor,
  webRtcService as unknown as any,
  webSocketService as unknown as any,
  webRtcCommands
);

if (!webRtcService.registeredHandlers.has(eventProcessor)) {
  throw new Error("EventNetworkBridge did not register the event processor with the WebRTC service");
}

if (!webRtcService.boundCommands.has(webRtcCommands.eventData)) {
  throw new Error("EventNetworkBridge did not bind the WebRTC event data handler");
}

if (webSocketService.listeners.length === 0) {
  throw new Error("EventNetworkBridge did not subscribe to WebSocket local events");
}

const localEvent = new LocalEvent(EventType.ServerNotification);
localEvent.setData({ message: "test" });
webSocketService.emit(localEvent);

const pendingLocalEvents = eventProcessor.getLocalQueue().getPendingEvents();
if (!pendingLocalEvents.includes(localEvent)) {
  throw new Error("Local events were not forwarded to the event processor");
}

const mockPeer = new MockWebRTCPeer();
const bridgedPeer = mockPeer as unknown as WebRTCPeer;
webRtcService.peers.push(bridgedPeer);

const remotePayload = new TextEncoder().encode("payload").buffer;
const remoteEvent = new RemoteEvent(EventType.ServerNotification);
remoteEvent.setData(remotePayload);

eventProcessor.sendEvent(remoteEvent);

if (mockPeer.lastPayload === null) {
  throw new Error("Remote events were not broadcast through WebRTC");
}

const payloadReader = BinaryReader.fromArrayBuffer(mockPeer.lastPayload);
const commandId = payloadReader.unsignedInt8();
if (commandId !== webRtcCommands.eventData) {
  throw new Error("Remote event payload used an unexpected command id");
}

const eventType = payloadReader.unsignedInt8();
if (eventType !== EventType.ServerNotification) {
  throw new Error("Remote event payload used an unexpected event type id");
}

const handler = webRtcService.boundCommands.get(webRtcCommands.eventData);
if (!handler) {
  throw new Error("WebRTC event data handler was not registered");
}

const inboundPayload = BinaryWriter.build()
  .unsignedInt8(EventType.ServerNotification)
  .arrayBuffer(remotePayload)
  .toArrayBuffer();

handler(bridgedPeer, BinaryReader.fromArrayBuffer(inboundPayload));

const pendingRemoteEvents = eventProcessor.getRemoteQueue().getPendingEvents();
if (pendingRemoteEvents.length !== 1) {
  throw new Error("Remote events were not routed into the processor queue");
}

const matchmakingService = new MockMatchmakingService();

new MatchmakingCoordinator(
  webRtcService as unknown as any,
  matchmakingService as unknown as any
);

if (webRtcService.connectionListener !== matchmakingService.networkService) {
  throw new Error("MatchmakingCoordinator did not eagerly wire the WebRTC connection listener");
}

console.log("Dependency injection wiring verified successfully.");

