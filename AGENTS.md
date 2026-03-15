# AGENTS.md — Hood Ball Architecture Reference

This document describes the functional design of the multiplayer systems in Hood Ball. Read it before touching any networking, event, entity, or chat code.

---

## Network Topology and Authority

The network uses a **star topology** with one player acting as the authoritative host. All non-host players connect exclusively to the host via WebRTC; non-host peers never connect to each other.

The host is the player who advertises a match. During matchmaking, if no open match is found, the client creates one and becomes the host. `MatchSession.isHost()` and `GamePlayer.isHost()` track this role. The host is both the authoritative game-logic executor and the WebRTC hub through which all peer-to-peer communication is routed.

All authoritative state changes originate from the host. Non-host players are clients that mirror what the host decides. To report something to the host (e.g. a hit), a non-host player sends a raw WebRTC message; the host validates and acts on it.

---

## WebSocket Game Server

The WebSocket connection is a persistent, authenticated channel between each client and the game server. It is **not** used for real-time game state; it handles matchmaking infrastructure, identity, chat routing, and administrative messages.

Upon connecting, the client immediately sends a JWT access token (`WebSocketType.Authentication`). The server validates it and responds with a signed user identity payload (the **user signature**, described further in Matchmaking). Once this handshake succeeds, a `ServerConnected` local event fires.

### Packet Types (`WebSocketType`)

| ID | Name | Direction | Purpose |
|----|------|-----------|---------|
| 0 | `Authentication` | Client → Server, Server → Client | Initial JWT auth; server responds with user signature |
| 1 | `OnlinePlayers` | Server → Client | Total number of connected players (broadcast periodically) |
| 2 | `PlayerRelay` | Bidirectional | WebRTC signaling tunnel: forwards SDP offers/answers and ICE candidates between peers |
| 3 | `ChatMessage` | Client → Server → Host | Chat relay: client sends raw text; server signs and forwards the signed payload to the host |
| 4 | `PlayerKicked` | Server → Host | Notifies the host that the server banned a specific user ID; host then broadcasts a `PlayerBanned` remote event |
| 5 | `Notification` | Server → Client | Server-pushed text messages to all or specific clients (informational, not game state) |

The WebSocket connection uses exponential backoff reconnection (1 s base, up to 30 s, max 50 attempts). All messages are binary (`ArrayBuffer`).

---

## Matchmaking

Matchmaking is a multi-stage process that produces a WebRTC-connected session with an authoritative host.

### Discovery

The client calls the REST API to find open matches filtered by `clientVersion` and game-mode attributes (`MATCH_ATTRIBUTES`). If matches are returned, the client sends WebRTC offers to each of them via the WebSocket relay (`WebSocketType.PlayerRelay`). A 10-second timer runs; if the host of any match completes the WebRTC handshake within that window, the client joins. If the timer expires without joining, the client falls back to becoming the host itself.

When becoming the host, `MatchFinderService.createAndAdvertiseMatch()` creates a local `MatchSession` (with `isHost = true`), marks `GamePlayer.isHost()` to `true`, and posts an advertise request to the REST API. The match is re-advertised every 60 seconds via an interval, and after every player join/leave event.

### WebRTC Handshake and Join Protocol

Once the WebRTC connection is physically established, the non-host sends a **JoinRequest** (`WebRTCType.JoinRequest`) containing:
- `userId` (32-char string) — the player's network identity
- `userName` (16-char string) — the display name
- `userSignature` — the server-issued ECDSA signature received during WebSocket authentication

The host verifies this signature with `MatchmakingNetworkService.verifyUserSignature()`, which reconstructs the payload (token bytes + userId + userName) and calls `SignatureService.verifyArrayBuffer()`. If verification fails, the peer is immediately disconnected.

If the match has no available slots, the peer is disconnected. Otherwise, the host creates a `GamePlayer` record, assigns a spawn point, and sends back a **JoinResponse** (`WebRTCType.JoinResponse`) containing the host's own identity and signature (also server-issued). The non-host verifies the host's signature in the same way before accepting the session.

Following the JoinResponse, the host sends the current player list via `PlayerConnection` messages, then a `SnapshotEnd` marker. The non-host acknowledges with `SnapshotACK`, at which point both sides mark each other as `joined = true` and full game traffic can flow.

### Identity Validation

User identity is backed by **WebAuthn passkeys**. Registration calls the server's registration endpoint (`/register-options`, `/verify-registration`), which stores the credential's public key. Authentication calls (`/authentication-options`, `/verify-authentication`) require the user to sign a server-provided challenge with their hardware-backed key. The server validates the assertion and responds with a JWT plus the **user signature** — an ECDSA P-256 signature over `(webrtcToken + userId + userName)` — that the client uses to prove its identity to hosts. This signature is bound to the specific WebRTC token, so it cannot be replayed in a different session.

---

## WebRTC and Data Channels

WebRTC is used for all real-time peer-to-peer communication during a match. The non-host side always creates the three data channels; the host receives them via the `ondatachannel` event. All channels use `binaryType = "arraybuffer"`.

### Data Channels

| Label | Ordered | Max Retransmits | Used For |
|-------|---------|-----------------|---------|
| `reliable-ordered` | Yes | unlimited | Join handshake, player list, snapshot, game events (`EventData`), graceful disconnect |
| `reliable-unordered` | No | unlimited | Chat messages, entity removal notifications |
| `unreliable-unordered` | No | 0 | Per-frame entity position/state updates, ping |

Messages on unordered channels carry a 16-bit sequence number inserted after the command ID. The receiver checks this against a 32-entry history window to detect and drop replayed or out-of-order packets.

Before a peer is fully `joined`, only the handshake commands (`JoinRequest`, `JoinResponse`, `PlayerConnection`, `SnapshotEnd`, `SnapshotACK`) are accepted. Any higher command ID is dropped until `joined = true`. Reliable messages queued before join are flushed once `setJoined(true)` fires.

### Signaling

SDP offers/answers and ICE candidates are exchanged through the WebSocket `PlayerRelay` channel. Each signaling message carries a 32-byte token that identifies the target peer. ICE candidates that arrive before the remote description is set are queued and applied once it is available. STUN/TURN server URLs are provided by the server registration response.

### Ping

The host sends a `PingRequest` to each joined peer every second via the unreliable-unordered channel. Peers respond with `PingResponse`. The host computes per-player ping and a match-wide median. Non-host players receive per-player ping data via `PlayerPing` messages.

---

## Event Queue System

Two independent queues coordinate game-state notifications. Both are drained once per frame by `EventConsumerService.consumeEvents()`.

### Local Queue

Dispatched with `EventProcessorService.addLocalEvent(event)`. Consumed via `EventConsumerService.subscribeToLocalEvent(type, callback)`. Events in this queue never travel over the network — they are process-local signals that both host and non-host subscribe to.

**Used for:** connection lifecycle (`ServerConnected`, `ServerDisconnected`, `ServerAuthenticated`), player session events (`PlayerConnected`, `PlayerDisconnected`, `HostDisconnected`), UI triggers (`ReturnToMainMenu`, `Countdown`, `SnowWeather`), and matchmaking notifications (`MatchmakingStarted`, `MatchAdvertised`, `OnlinePlayers`).

Any code, host or not, can subscribe and will receive local events generated within its own process.

**Example — `PlayerConnected`:**
When the join handshake completes, both the host and the newly joined player fire `PlayerConnected` independently from their own matchmaking layers — no network hop involved. Every client (host or not) has this subscription and uses it to spawn the new player's car on the field and update the player list. Each side knows the new player's data from the handshake it already performed, so no additional message is needed.

### Remote Queue

Dispatched by the host with `EventProcessorService.sendEvent(event)`, which serialises the event as `WebRTCType.EventData` and sends it **reliably-ordered** to all joined peers. Non-host players receive it over WebRTC; `handleEventData` deserialises it and places it in the remote queue. Consumed via `EventConsumerService.subscribeToRemoteEvent(type, callback)`.

**Used for:** authoritative game-state changes that all non-host clients must mirror — goal scored, game over, car demolished, boost pad consumed, player banned, etc.

`handleEventData` silently drops any event not originating from the host (`webrtcPeer.getPlayer()?.isHost() === false`). This is the anti-cheat guard: non-host players cannot inject remote events.

**Example — `GoalScored`:**
When the host detects that the ball crossed the goal line, it immediately applies the authoritative effects inline — increments the scorer's points, shows the goal celebration, and triggers the explosion animation. It then dispatches `GoalScored` to all peers carrying the scorer's identity and new score. Non-host players receive it over the reliable-ordered channel, subscribe to it, and mirror the exact same effects on their side. The host never needs to enqueue this as a local event because it already executed the logic before sending.

**`sendEvent` does not loop back to the host's own queues.** When the host triggers an authoritative effect, it applies it inline (directly in the authoritative handler) and then calls `sendEvent` to inform peers. The host does not subscribe to remote events, and does not need `addLocalEvent` for those game-logic effects.

---

## Entity Ownership

All synchronisable entities extend `BaseMultiplayerGameEntity`, which carries an `owner: Player | null` field alongside a network ID (`id`) and a type registry ID (`typeId`).

### Local (owned) entities

A player owns any entity where `entity.getOwner() === localPlayer`. The `EntityOrchestratorService` scans all syncable entities each frame and skips those not owned by the local player — **unless** the local player is the host, in which case it sends all entities regardless of owner. This means non-host players only broadcast their own entities; the host broadcasts every entity.

Entities with `syncableByHost = true` (e.g. the ball, boost pads) have no owner initially. The orchestrator auto-assigns them to the host player when they are first encountered without an owner.

### Remote (mirrored) entities

When an `EntityData` message arrives, the orchestrator validates the owner claim using `EntityUtils.hasInvalidOwner()`: if the sending peer is not the host, the claimed `ownerId` must exactly match the peer's own player ID. The host is exempt from this check and may send updates for any entity. If the validation fails, the message is discarded with a warning.

If the entity does not yet exist locally, the orchestrator resolves its class from the type registry, looks up the owner player from the current match session, calls `entityClass.deserialize(id, data)`, sets the owner, and adds it to the scene. If it already exists, it calls `entity.synchronize(data)`. When an entity transitions to `Inactive`, it is removed from the scene on all clients.

Each entity serialises its state (position, velocity, custom fields) into a compact binary `ArrayBuffer` via `serialize()` / `synchronize()`. Position coordinates are scaled by a factor of 10 and stored as 16-bit integers; angles by 32767/π; speeds by 100.

---

## Entity Orchestrator

`EntityOrchestratorService` owns the per-frame synchronisation loop. It sits between the scene's entity list and the WebRTC layer.

### Sending

On each game frame, `sendLocalData(scene, deltaTime)` iterates all entities returned by `scene.getSyncableEntities()`. An entity is sent if any of these conditions is true:
- `mustSync()` — a one-shot unreliable-unordered sync was requested
- `mustSyncReliably()` — a reliable-ordered sync was requested (e.g. after a physics reset)
- A 500 ms periodic timer has elapsed (forces a full-state broadcast to keep remote clients in sync)

After sending, both `sync` and `syncReliably` flags are cleared. The entity data is not sent back to the entity's own owner.

Removal is handled as a final reliable-unordered message: when an entity moves to `Inactive`, `isRemoved()` becomes `true` and the next send uses the reliable-unordered channel before the entity is discarded locally.

### Receiving

The `@PeerCommandHandler(WebRTCType.EntityData)` decorator routes incoming entity packets to `handleEntityData()`. The handler:
1. Reads scene ID, entity state, entity type ID, owner ID, entity ID, and raw data.
2. Validates the owner (`EntityUtils.hasInvalidOwner`) — drops the message if invalid.
3. Resolves the target scene by ID — drops if not found.
4. Dispatches to `createOrSynchronizeEntity` (Active state) or `removeEntity` (Inactive state).

Entity creation validates that the owner player exists in the current match session; if not, the message is dropped. Deserialisation errors are caught and logged without crashing the frame.

---

## Chat System

Chat messages are subject to server-side content filtering and cryptographic signing before any player sees them. The flow is designed so that a malicious client cannot inject unsigned or spoofed chat content.

### Message Flow

1. **Any player** (host or non-host) calls `ChatService.sendMessage(text)`. This sends a `WebSocketType.ChatMessage` packet with the raw text to the WebSocket game server.
2. **The game server** applies content filtering, stamps the message with the sender's `userId` and a Unix timestamp, and signs the complete payload (`userId + text + timestamp`) using its ECDSA P-256 private key.
3. **The signed message** is delivered by the game server exclusively to the **host** (as a `WebSocketType.ChatMessage` response).
4. **The host's `handleChatMessage`** (a `@ServerCommandHandler`) receives the signed packet, appends the local player's own messages to its UI, and relays the full signed payload (userId + text + timestamp + signature) to all connected peers via `WebRTCType.ChatMessage` on the reliable-unordered channel.
5. **Non-host peers** receive the signed packet in `handlePeerChatMessage` (a `@PeerCommandHandler`). Before displaying anything, they call `SignatureService.verifyArrayBuffer(payload, signature)` using the server's ECDSA P-256 public key (distributed at login). If verification fails, the message is silently dropped.

### Spoofing Resistance

Chat messages cannot be spoofed or replayed because:
- All messages must pass through the game server before delivery.
- The server's signature binds `userId`, `text`, and `timestamp` together; altering any field invalidates the signature.
- The signing key is held only by the server; clients hold only the public key for verification.
- A forged message injected directly into the host's `handlePeerChatMessage` path (bypassing the server) would fail the signature check and be dropped.

### Chat Commands

Text prefixed with `/` is treated as a command. Commands are consumed locally without appearing in the chat UI. Currently:
- `/snow` — triggers a `LocalEvent(EventType.SnowWeather)` on every client that receives the message, activating a snow-particle effect. The original sender applies the effect immediately on send; other players apply it upon receiving the signed relay.

Command execution is throttled per-player per-command (500 ms minimum interval) and logged to the match actions log. Chat history is capped at 50 messages.
