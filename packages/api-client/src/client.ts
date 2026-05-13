import { ApiError, parseError } from "./errors";

export type TokenProvider = () =>
  | string
  | null
  | undefined
  | Promise<string | null | undefined>;

export type ApiClientOptions = {
  /** API base URL without trailing slash, e.g. "http://localhost:5283" */
  baseUrl: string;
  /** Returns a bearer token (or null/undefined for anonymous calls). */
  getToken?: TokenProvider;
  /** Override fetch (e.g. Next.js fetch with revalidation) */
  fetch?: typeof fetch;
};

export type RequestOptions = {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Extra fetch options passed through (cache, next.revalidate, signal). */
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } };
};

export class HttpClient {
  constructor(private readonly opts: ApiClientOptions) {}

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>("GET", path, options);
  }
  post<T>(path: string, options?: RequestOptions) {
    return this.request<T>("POST", path, options);
  }
  put<T>(path: string, options?: RequestOptions) {
    return this.request<T>("PUT", path, options);
  }
  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>("DELETE", path, options);
  }

  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const url = buildUrl(this.opts.baseUrl, path, options.query);
    const headers = new Headers(options.init?.headers);

    let bodyInit: BodyInit | undefined;
    if (options.body !== undefined && options.body !== null) {
      headers.set("Content-Type", "application/json");
      bodyInit = JSON.stringify(options.body);
    }

    if (this.opts.getToken) {
      const token = await this.opts.getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const fetchImpl = this.opts.fetch ?? fetch;
    const response = await fetchImpl(url, {
      ...options.init,
      method,
      headers,
      body: bodyInit,
    });

    if (!response.ok) throw await parseError(response);

    if (response.status === 204) return undefined as T;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return (text as unknown) as T;
    }

    return (await response.json()) as T;
  }

  /**
   * Raw streaming request. Returns the underlying `Response` so the caller can
   * read `response.body` as a `ReadableStream`. Mirrors the token-injection and
   * base-URL handling of `request<T>()`, but skips body parsing — use this for
   * SSE / NDJSON / any non-JSON body that needs to be consumed incrementally.
   *
   * Throws `ApiError` on non-2xx (consuming the response body as text for the
   * error message).
   */
  async openStream(path: string, init: RequestInit = {}): Promise<Response> {
    const url = `${this.opts.baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = new Headers(init.headers);
    if (this.opts.getToken) {
      const token = await this.opts.getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    if (init.body && !headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");

    const fetchImpl = this.opts.fetch ?? fetch;
    const response = await fetchImpl(url, { ...init, headers });
    if (!response.ok) throw await parseError(response);
    return response;
  }
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions["query"],
): string {
  const base = baseUrl.replace(/\/$/, "");
  const rel = path.startsWith("/") ? path : `/${path}`;
  if (!query) return `${base}${rel}`;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}${rel}?${qs}` : `${base}${rel}`;
}

export { ApiError };
