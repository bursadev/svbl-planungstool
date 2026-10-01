/**
 * Request core shared by the browser client (`client.ts`) and the server client (`server.ts`).
 * Only the way the bearer token is obtained differs between the two.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

/** One field error from the backend's validation filter. */
export type ApiFieldError = { field: string; message: string };

/** Error body shape produced by the backend's `HttpExceptionFilter`. */
type ApiErrorBody = { statusCode?: number; message?: string; errors?: ApiFieldError[] };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Field errors (`400 Eingabe ungültig.`); absent for every other error. */
    readonly errors?: ApiFieldError[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON-serializable request body. */
  body?: unknown;
  /** Attach the Clerk bearer token (default true). Set false for public endpoints. */
  auth?: boolean;
  signal?: AbortSignal;
};

/** Signature shared by `apiFetch` and `serverApiFetch`, so data functions can take either. */
export type ApiFetcher = <T = unknown>(path: string, options?: ApiFetchOptions) => Promise<T>;

function isFieldErrors(value: unknown): value is ApiFieldError[] {
  return (
    Array.isArray(value) &&
    value.every(
      (e) => typeof e === "object" && e !== null && typeof e.field === "string" && typeof e.message === "string",
    )
  );
}

/** Sends the request with the given token and maps the response; throws `ApiError` on non-2xx. */
export async function sendRequest<T>(
  path: string,
  { method, body, signal }: ApiFetchOptions,
  token: string | null,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: method ?? (body !== undefined ? "POST" : "GET"),
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      data?.message ?? res.statusText,
      isFieldErrors(data?.errors) ? data.errors : undefined,
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
