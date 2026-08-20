/**
 * Shared HTTP client for every `Api*Service` (Phase 12: "replace mock
 * services incrementally... maintain backward compatibility with
 * established frontend contracts" — this file plus `services/index.ts`'s
 * env-based swap are the only new plumbing; no component or hook changes).
 *
 * Auth model: the backend issues a short-lived access token in the login/
 * register/refresh response body, and a separate rotating refresh token in
 * an httpOnly, `SameSite=Strict` cookie scoped to `/api/v1/auth` (see
 * backend/src/auth/auth.controller.ts) — invisible to and untouchable by
 * this file, by design. The access token is kept in memory only (a module-
 * level variable, never localStorage) — safer against XSS exfiltration,
 * at the cost of not surviving a page reload, which is exactly why
 * `ApiAuthService.getSession()` calls `/auth/refresh` on boot to mint a
 * fresh one from the cookie the browser already holds.
 */

let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

function baseUrl(): string {
  const configured = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
  if (!configured) {
    throw new Error("VITE_API_BASE_URL is not set — the real API client can't be used without it.");
  }
  return configured.replace(/\/+$/, "");
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; requestId?: string; details?: unknown };
}

/** Thrown for any non-2xx response — carries the backend's own error code/requestId for callers that need to distinguish cases (e.g. a 409 conflict), while `.message` alone is what most UI error handling already expects (mock services throw plain `Error`s with a user-facing message). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly requestId?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorMessage(res: Response): Promise<ApiErrorBody["error"]> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return body.error;
  } catch {
    return undefined;
  }
}

/** Single-flight: if several requests 401 at once, only one refresh call is made and every caller awaits the same result — avoids a refresh stampede. */
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${baseUrl()}/auth/refresh`, { method: "POST", credentials: "include" });
        if (!res.ok) {
          setAccessToken(null);
          return false;
        }
        const body = (await res.json()) as { data: { accessToken: string } };
        setAccessToken(body.data.accessToken);
        return true;
      } catch {
        setAccessToken(null);
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Internal — set on the retry attempt after a refresh, to stop an infinite 401→refresh→401 loop. */
  _isRetry?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${baseUrl()}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * The one function every `Api*Service` method funnels through. `T` is the
 * shape of the response envelope's `data` field — callers that also need
 * `meta` (pagination) use `requestWithMeta` instead.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await requestWithMeta<T>(path, options);
  return data;
}

export async function requestWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  const token = getAccessToken();
  if (token) headers["authorization"] = `Bearer ${token}`;

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    credentials: "include", // sends the refresh cookie on /auth/* calls; harmless no-op elsewhere
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !options._isRetry && !path.startsWith("/auth/")) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return requestWithMeta<T>(path, { ...options, _isRetry: true });
    }
  }

  if (!res.ok) {
    const error = await parseErrorMessage(res);
    throw new ApiError(
      error?.message ?? `Request failed (${res.status}).`,
      res.status,
      error?.code,
      error?.requestId,
      error?.details,
    );
  }

  if (res.status === 204) return { data: undefined as T };
  const body = (await res.json()) as { data: T; meta?: Record<string, unknown> };
  return body;
}

/** Returns `null` instead of throwing on a 404 — matches every mock service's `getById` contract (not-found is a value, not an error, in this codebase's UI layer). */
export async function apiRequestOrNull<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  try {
    return await apiRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
