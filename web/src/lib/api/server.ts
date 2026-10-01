import "server-only";
import { auth } from "@clerk/nextjs/server";
import { sendRequest, type ApiFetchOptions } from "./request";

export { ApiError, API_BASE_URL, type ApiFetchOptions, type ApiFetcher, type ApiFieldError } from "./request";

/**
 * Calls the backend from Server Components, Route Handlers and Server Actions with the
 * server-side Clerk session token. Same contract as `apiFetch`.
 */
export async function serverApiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = options.auth === false ? null : await (await auth()).getToken();
  return sendRequest<T>(path, options, token);
}
