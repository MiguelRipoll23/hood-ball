# Refactoring TODOs

## Cross-Cutting
- [ ] Replace the service-locator style `inject(...)` defaults with explicit constructor injection so the container can wire dependencies predictably (`packages/game/src/loop/game-loop-facade.ts:48`, `packages/game/src/services/network/webrtc-service.ts:30`, `packages/engine/src/services/events/event-processor-service.ts:23`).
- [ ] Standardise lifecycle hooks instead of doing heavy wiring inside constructors (see `packages/game/src/services/network/event-network-bridge.ts:39`, `packages/game/src/services/gameplay/matchmaking-coordinator.ts:4`).

## Engine Layer
- [ ] Allow `SceneManagerService` to receive its `SceneTransitionService` via injection rather than `new` to honour inversion of control and make testing simpler (`packages/engine/src/services/scene/scene-manager-service.ts:13`).
- [ ] Revisit `EventProcessorService` queue ownership: expose queues as injectable collaborators instead of internal singletons so alternate queue implementations (bounded, prioritised) are possible (`packages/engine/src/services/events/event-processor-service.ts:18`).
- [ ] Implement capacity/flush strategy in `EventQueueService` rather than the current "remove after 50 consumed" heuristic to avoid long-lived arrays in high-throughput scenarios (`packages/engine/src/services/events/event-queue-service.ts:18`).

## Game Layer
- [ ] Break up `GameLoopFacade` into smaller collaborators (loop configuration, scene bootstrapping, network failure handling, debug HUD) to trim its sprawling dependency list and responsibilities (`packages/game/src/loop/game-loop-facade.ts:48`).
- [ ] Add teardown logic for the local event subscriptions recorded in the loop facade to prevent stale handlers across restarts (`packages/game/src/loop/game-loop-facade.ts:46`).
- [ ] Decouple scene selection from concrete scene classes so the facade can work with abstractions supplied by `GameSceneProvider` (`packages/game/src/loop/game-loop-facade.ts:177`).
- [ ] Split `WebRTCService` into signalling, peer-tracking, and diagnostics components; the current class handles protocol dispatch, stats, and rendering concerns simultaneously (`packages/game/src/services/network/webrtc-service.ts:20`).
- [ ] Extract the player identity/spawn management and event publication duties out of `MatchmakingNetworkService` to reduce its monolithic networking + gameplay surface area (`packages/game/src/services/network/matchmaking-network-service.ts:36`).
- [ ] Replace the constructor-driven wiring in `EventNetworkBridge` with an explicit `initialize` step so registration order is controlled and testable (`packages/game/src/services/network/event-network-bridge.ts:39`).
- [ ] Move the matchmaking coordinator's side-effect (registering the WebRTC listener) into an init method that the bootstrapper calls, avoiding surprising work during container build (`packages/game/src/services/gameplay/matchmaking-coordinator.ts:4`).
- [ ] Review `WebSocketService` and extract a reconnection policy object plus payload dispatcher to tame its current mix of transport, retry strategy, and event emission (`packages/game/src/services/network/websocket-service.ts:14`).
