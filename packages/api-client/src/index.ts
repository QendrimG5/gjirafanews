import { HttpClient, type ApiClientOptions } from "./client";
import { ArticlesApi } from "./articles";
import { CategoriesApi } from "./categories";
import { SourcesApi } from "./sources";
import { NotificationsApi } from "./notifications";
import { ChatApi } from "./chat";
import { UploadsApi } from "./uploads";
import { EmailsApi } from "./emails";
import { UsersApi } from "./users";

export type ApiClient = {
  http: HttpClient;
  articles: ArticlesApi;
  categories: CategoriesApi;
  sources: SourcesApi;
  notifications: NotificationsApi;
  chat: ChatApi;
  uploads: UploadsApi;
  emails: EmailsApi;
  users: UsersApi;
};

export function createApiClient(options: ApiClientOptions): ApiClient {
  const http = new HttpClient(options);
  return {
    http,
    articles: new ArticlesApi(http),
    categories: new CategoriesApi(http),
    sources: new SourcesApi(http),
    notifications: new NotificationsApi(http),
    chat: new ChatApi(http),
    uploads: new UploadsApi(http),
    emails: new EmailsApi(http),
    users: new UsersApi(http),
  };
}

export { ApiError } from "./errors";
export { HttpClient } from "./client";
export type { ApiClientOptions, RequestOptions, TokenProvider } from "./client";
export * from "./types";
