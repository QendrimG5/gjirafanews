import { HttpClient, type RequestOptions } from "./client";
import type { NotificationDto, BroadcastNotificationRequest } from "./types";

export class NotificationsApi {
  constructor(private readonly http: HttpClient) {}

  list(query: { limit?: number } = {}, options?: RequestOptions) {
    return this.http.get<NotificationDto[]>("/api/notifications", {
      ...options,
      query: { limit: query.limit ?? 50, ...options?.query },
    });
  }

  broadcast(body: BroadcastNotificationRequest) {
    return this.http.post<void>("/api/notifications/broadcast", { body });
  }

  test() {
    return this.http.post<void>("/api/notifications/test");
  }
}
