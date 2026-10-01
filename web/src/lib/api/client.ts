import { getAuthToken } from "./auth-token";
import { sendRequest, type ApiFetchOptions } from "./request";

export { ApiError, API_BASE_URL, type ApiFetchOptions, type ApiFetcher, type ApiFieldError } from "./request";

/** Calls the backend from the browser, attaching the Clerk session token as a bearer token. */
export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = options.auth === false ? null : await getAuthToken();
  return sendRequest<T>(path, options, token);
}
