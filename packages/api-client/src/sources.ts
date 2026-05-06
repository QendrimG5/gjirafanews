import { HttpClient, type RequestOptions } from "./client";
import type {
  SourceDto,
  CreateSourceRequest,
  UpdateSourceRequest,
} from "./types";

export class SourcesApi {
  constructor(private readonly http: HttpClient) {}

  list(options?: RequestOptions) {
    return this.http.get<SourceDto[]>("/api/sources", options);
  }

  get(id: number, options?: RequestOptions) {
    return this.http.get<SourceDto>(`/api/sources/${id}`, options);
  }

  create(body: CreateSourceRequest) {
    return this.http.post<SourceDto>("/api/sources", { body });
  }

  update(id: number, body: UpdateSourceRequest) {
    return this.http.put<SourceDto>(`/api/sources/${id}`, { body });
  }

  delete(id: number) {
    return this.http.delete<void>(`/api/sources/${id}`);
  }
}
