import { HttpClient, type RequestOptions } from "./client";
import type { ChatMessageDto } from "./types";

export class ChatApi {
  constructor(private readonly http: HttpClient) {}

  recent(query: { limit?: number } = {}, options?: RequestOptions) {
    return this.http.get<ChatMessageDto[]>("/api/live-chat/messages", {
      ...options,
      query: { limit: query.limit ?? 100, ...options?.query },
    });
  }
}
