/**
 * Injection point for the auth token, so the API client never imports Clerk.
 * `AuthTokenBridge` registers Clerk's `getToken` once on mount.
 */
type TokenGetter = () => Promise<string | null>;

let getter: TokenGetter = async () => null;

export function setAuthTokenGetter(fn: TokenGetter): void {
  getter = fn;
}

export function getAuthToken(): Promise<string | null> {
  return getter();
}
