# Engine/Game Architecture

Hood Ball now treats the reusable engine and the game experience as two independent layers. The engine exposes contracts and services for rendering, input, timing, scenes, and event dispatch. The game layer registers implementations for domain-specific concerns such as matchmaking, networking, and UI scenes.

## Layer Diagram
Engine Layer:
  createEngineContainer -> registerEngineServices -> engine contracts
  engine contracts -> resolve -> core services

Game Layer:
  registerGameServices -> adapter bindings -> game services
  adapter bindings -> bridge -> engine contracts
  game services -> drive -> EngineLoopService

## Initialization Flow
1. startGame calls createEngineContainer to produce an empty DI container.
2. registerEngineServices binds render, input, scene, timing, and event services into the container using engine-owned tokens.
3. registerGameServices adds matchmaking, networking, security, UI, and gameplay services, and wires adapters that bridge engine contracts with game enums and payloads.
4. GameLoopFacade resolves the EngineLoopService and injects the prepared scene provider and orchestrators before calling start.

Flow overview:
  startGame
    |
  createEngineContainer
    |
  registerEngineServices
    |
  registerGameServices
    |
  EngineLoopService.start

## Adapter Patterns
The game layer supplies concrete values for engine contracts through a handful of adapter bindings during registerGameServices.

Event identifier resolver:
- Token EVENT_IDENTIFIER_RESOLVER_TOKEN
- Purpose Allows debug tooling and logs to map numeric event identifiers back to readable enum names.
- Game binding Wraps EventType so the engine can call getName(id) and receive a string or null when unknown.

WebRTC command map:
- Token WEBRTC_COMMAND_MAP_TOKEN
- Purpose Tells the engine which command id contains gameplay payloads during peer-to-peer communication.
- Game binding Provides { eventData: WebRTCType.EventData } to align the engine dispatcher with the game signalling protocol.

Engine WebRTC service bridge:
- Token ENGINE_WEBRTC_SERVICE_TOKEN
- Purpose Exposes the game-provided WebRTCService through an engine-facing abstraction so event processors can remain agnostic of the concrete implementation.
- Game binding Uses useExisting to map the token to the WebRTCService instance.

Scene provisioning:
- Contract GameSceneProvider
- Purpose Lets the game select initial and transition scenes without the engine importing game modules directly.
- Game binding Registers a resolvable provider that knows how to construct scene controllers and injects engine services as constructor dependencies.

## Conventions
- Engine modules never import game code. Cross-layer communication relies on tokens and contracts defined under src/engine/contracts.
- Game modules prefer importing engine collaborators via the @engine alias or contract tokens rather than deep relative paths.
- Adapter bindings belong in registerGameServices or other bootstrap modules so runtime services remain declarative and testable.
