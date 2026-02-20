# Client Auth Migration Plan (access + rotating refresh)

## Storage strategy
- `accessToken`: memory-only (`APIService.accessToken`).
- `refreshToken`: persisted in `localStorage` (`hoodBall.refreshToken`) and mirrored in memory.
- `serverRegistration` bootstrap data (`userSymmetricKey`, ICE servers, signature key, profile fields) is persisted in `localStorage` (`hoodBall.serverRegistration`) to support cold-start reconstruction after refresh.
- On logout/refresh rejection both token state and persisted registration are cleared.

## Request/refresh workflow
1. All authenticated HTTP calls go through `APIService.fetchWithAuthentication`.
2. If no access token is in memory, `tryRestoreSession()` performs a cold-start refresh.
3. After successful refresh, `tryRestoreSession()` restores `GameServer.serverRegistration` from persisted bootstrap data; if restoration is impossible/corrupt, the client clears session and forces full re-authentication.
4. If an API call returns `401`, the client triggers refresh and retries the original request once.
5. Refresh requests are serialized with a lock (`refreshPromise`) so concurrent `401`s do not produce parallel refresh calls.
6. Refresh rotation is handled atomically by replacing both access and refresh tokens only after a validated successful refresh response.
7. If refresh fails due to explicit server rejection (`response.ok === false`), session state is cleared and the caller gets `Session expired. Please sign in again.`.
8. If refresh fails due to transient/network errors, `tryRestoreSession()` returns `false` without wiping persisted refresh state.

## Race condition protections for rotating refresh
- Single-flight refresh lock prevents consuming the same refresh token from multiple simultaneous refresh requests.
- Every waiter awaits the same refresh promise and uses the newly rotated token pair afterward.
- Original request is retried only once to avoid infinite loops.
- `APIService.setAccessToken(...)` also updates the in-memory `ServerRegistration` token so websocket/session token copies stay synchronized.

## Websocket/session invalidation
- Websocket uses `APIService.getAccessToken()` only (no fallback to stale registration token).
- Session clear dispatches `hoodball:session-cleared`; websocket listens and disconnects immediately.

