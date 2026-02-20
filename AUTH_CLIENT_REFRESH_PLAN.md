# Client Auth Migration Plan (access + rotating refresh)

## Storage strategy
- `accessToken`: memory-only (`APIService.accessToken`).
- `refreshToken`: persisted in `localStorage` (`hoodBall.refreshToken`) and mirrored in memory.
- On logout/refresh failure both are cleared.

## Request/refresh workflow
1. All authenticated HTTP calls go through `APIService.fetchWithAuthentication`.
2. If no access token is in memory, `tryRestoreSession()` performs a cold-start refresh.
3. If an API call returns `401`, the client triggers refresh and retries the original request once.
4. Refresh requests are serialized with a lock (`refreshPromise`) so concurrent `401`s do not produce parallel refresh calls.
5. Refresh rotation is handled atomically by replacing both access and refresh tokens only after a successful refresh response.
6. If refresh fails, session state is cleared and the caller gets `Session expired. Please sign in again.` so UI can trigger logout flow.

## Race condition protections for rotating refresh
- Single-flight refresh lock prevents consuming the same refresh token from multiple simultaneous refresh requests.
- Every waiter awaits the same refresh promise and uses the newly rotated token pair afterward.
- Original request is retried only once to avoid infinite loops.

## Implemented files
- `src/game/services/network/api-service.ts`
- `src/game/services/security/credential-service.ts`
- `src/game/services/network/player-moderation-service.ts`
- `src/game/services/network/websocket-service.ts`

