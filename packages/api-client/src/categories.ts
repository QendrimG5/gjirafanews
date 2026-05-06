import { HttpClient, type RequestOptions } from "./client";
import type {
  CategoryDto,
  CategoryWithCountDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "./types";

export class CategoriesApi {
  constructor(private readonly http: HttpClient) {}

  list(options?: RequestOptions) {
    return this.http.get<CategoryWithCountDto[]>("/api/categories", options);
  }

  get(id: number, options?: RequestOptions) {
    return this.http.get<CategoryWithCountDto>(`/api/categories/${id}`, options);
  }

  create(body: CreateCategoryRequest) {
    return this.http.post<CategoryDto>("/api/categories", { body });
  }

  update(id: number, body: UpdateCategoryRequest) {
    return this.http.put<CategoryDto>(`/api/categories/${id}`, { body });
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/categories/${id}`);
  }
}
