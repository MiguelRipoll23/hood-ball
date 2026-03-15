# AGENTS.md — Event Queue System

Two queues coordinate multiplayer state. Read this before touching any event-related code.

---

## Queues

**Local queue** — same-process only, never travels over the network. Dispatched with `addLocalEvent`. Consumed via `subscribeToLocalEvent`. Both host and non-host subscribe.

**Remote queue** — sent by the host over WebRTC to all connected peers. Dispatched with `sendEvent`. Consumed via `subscribeToRemoteEvent`. Only non-host players subscribe. `handleEventData` silently drops any message not originating from the host (anti-cheat guard).

`sendEvent` does not loop back to the host's own queues. If the host needs its own subscription to fire, it must also call `addLocalEvent`.

Events in both queues are drained once per frame by `EventConsumerService.consumeEvents()`.

---

## Local event example — Player connected

When a new player joins, the matchmaking service dispatches `PlayerConnected` locally. Every client (host or not) has this subscription and uses it to update the player list and spawn the new player's entity. No network hop involved — each client receives the connection notification from its own matchmaking layer.

---

## Remote event example — Authoritative game-state change

When the host detects that a plane was destroyed, it applies the effect **inline** (crash animation, health = 0, match log entry) and then calls `sendEvent(RemoteEvent(PlaneExploded))` to broadcast to all peers. Non-host players receive this, their `subscribeToRemoteEvent` fires, and they apply the same effects on their side.

The host never needs `addLocalEvent` for game-logic events because it already executed the effect directly before sending.

---

## Rules

- Non-host players never call `sendEvent` or dispatch game-logic local events. To report something to the host (e.g. a hit), they send a raw WebRTC message (e.g. `HitReport`). The host validates it and dispatches the events.
- The host applies all game-logic effects **inline** (directly in the authoritative handler), then calls `sendEvent` to inform peers. No `addLocalEvent` needed for game events.
- The host never subscribes to remote events — it is the source of them.
- Local events are for lifecycle, connection, and UI: `PlayerConnected`, `PlayerDisconnected`, `ServerDisconnected`, `HostDisconnected`, `ReturnToMainMenu`, `SnowWeather`, etc.
- Remote events are for authoritative game state that all non-host clients must mirror: kills, respawns, scores, damage, etc.

