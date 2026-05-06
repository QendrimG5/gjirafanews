import { HttpClient, type RequestOptions } from "./client";
import type {
  ArticleListDto,
  ArticleDetailDto,
  CategoryStatsDto,
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
}
