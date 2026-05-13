import { HttpClient, type RequestOptions } from "./client";
import type {
  ArticleListDto,
  ArticleDetailDto,
  ArticleSearchResponse,
  CategoryStatsDto,
  ChatRequest,
  ChatStreamEvent,
  CreateArticleRequest,
  UpdateArticleRequest,
} from "./types";

export class ArticlesApi {
  constructor(private readonly http: HttpClient) {}

  list(query: { page?: number } = {}, options?: RequestOptions) {
    return this.http.get<ArticleListDto[]>("/api/articles", {
      ...options,
      query: { page: query.page ?? 1, ...options?.query },
    });
  }

  get(id: number, options?: RequestOptions) {
    return this.http.get<ArticleDetailDto>(`/api/articles/${id}`, options);
  }

  create(body: CreateArticleRequest) {
    return this.http.post<ArticleDetailDto>("/api/articles", { body });
  }

  update(id: number, body: UpdateArticleRequest) {
    return this.http.put<ArticleDetailDto>(`/api/articles/${id}`, { body });
  }

  stats(options?: RequestOptions) {
    return this.http.get<CategoryStatsDto[]>("/api/articles/stats", options);
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/articles/${id}`);
  }

  top(query: { topN?: number } = {}) {
    return this.http.get<ArticleListDto[]>("/api/articles/top", { query });
  }

  trending(query: { days?: number; limit?: number } = {}) {
    return this.http.get<ArticleListDto[]>("/api/articles/trending", { query });
  }

  // Semantic search: embeds `q` server-side, runs ANN against article_embeddings.
  search(query: { q: string; limit?: number }, options?: RequestOptions) {
    return this.http.get<ArticleSearchResponse>("/api/articles/search", {
      ...options,
      query: { q: query.q, limit: query.limit ?? 20, ...options?.query },
    });
  }

  /**
   * Streams a RAG-style answer to `body.question`. Calls `onEvent` for every
   * SSE frame parsed off the wire — `sources` arrives first, then many
   * `token` events, then a single `done` (or `error` on failure).
   *
   * Pass an `AbortSignal` to cancel mid-stream (frontend "Stop" button). The
   * resulting `fetch` abort propagates all the way through to the .NET
   * endpoint, which in turn cancels its outbound call to OpenAI — no wasted
   * tokens after the user stops.
   *
   * Resolves when the stream is exhausted (clean close or abort). Errors
   * surfaced to the caller as a thrown `ApiError` (non-2xx HTTP) or via an
   * `{ type: "error" }` event emitted before clean close (server-side
   * exception mid-stream).
   */
  async streamChat(
    body: ChatRequest,
    onEvent: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await this.http.openStream("/api/articles/chat", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Accept: "text/event-stream" },
      signal,
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frame boundary is a blank line (\n\n). Keep the trailing partial
      // frame in the buffer until the next chunk arrives.
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const dataLine = frame.split("\n").find((l) => l.startsWith("data: "));
        if (!dataLine) continue;
        const json = dataLine.slice(6);
        try {
          onEvent(JSON.parse(json) as ChatStreamEvent);
        } catch {
          // Malformed JSON — skip the frame rather than killing the stream.
        }
      }
    }
  }
}
