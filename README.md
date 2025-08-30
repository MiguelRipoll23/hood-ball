# Hood Ball

Accelerate and smash your way to victory in a car-based multiplayer soccer
battle.

## Features

- Passkey for registration and login
- JSON Web Tokens for game server authentication
- WebSocket for real-time notifications and tunneled communication between
  server and player
- WebRTC for real-time communication between host and players
- Web Crypto API for server configuration and player scores handling
- Debug menu to inspect game and network state

## Matchmaking Architecture

The matchmaking layer is split into focused services:

- `MatchmakingService` discovers or advertises matches.
- `MatchLifecycleService` handles game-over flow and score saving.
- `MatchmakingNetworkService` manages network peers and dispatches
  connection events.
- `MatchmakingCoordinator` wires WebRTC, the event processor and the
  networking layer during startup.

Services interact through dependency injection and an event bus to avoid
circular dependencies and lazy initialization.

## Demo

https://github.com/user-attachments/assets/ae4b8b25-a3d4-4fdd-a5bf-f9d1fcb16f09

### Debug UI

![Sceneshot showing debug menu using Dear imgui](https://github.com/user-attachments/assets/85af22e7-4b85-4d1f-b68c-bc8eb4476b82)

## Contributions

I welcome contributions of all kinds! Whether you're fixing bugs, adding new
features, improving documentation, or suggesting enhancements, your efforts are
appreciated.

Play, Create & Share
