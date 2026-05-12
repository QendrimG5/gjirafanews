import { HttpClient, type RequestOptions } from "./client";
import type {
  ApiEnvelope,
  CreateUserRequest,
  CurrentUserResponse,
  UpdateUserRequest,
  UserResponse,
} from "./types";

/**
 * Unwraps the ApiResponse<T> envelope used by /users endpoints. Throws if the
 * server returned `success: false` (HttpClient already throws on non-2xx;
 * this guards against an envelope-level failure on a 200 response).
 */
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === null) {
    throw new Error(envelope.message ?? "API call failed");
  }
  return envelope.data;
}

export class UsersApi {
  constructor(private readonly http: HttpClient) {}

  async me(options?: RequestOptions): Promise<CurrentUserResponse> {
    const env = await this.http.get<ApiEnvelope<CurrentUserResponse>>("/users/me", options);
    return unwrap(env);
  }

  async list(options?: RequestOptions): Promise<UserResponse[]> {
    const env = await this.http.get<ApiEnvelope<UserResponse[]>>("/users", options);
    return unwrap(env);
  }

  async get(id: string, options?: RequestOptions): Promise<UserResponse> {
    const env = await this.http.get<ApiEnvelope<UserResponse>>(`/users/${id}`, options);
    return unwrap(env);
  }

  async create(body: CreateUserRequest): Promise<UserResponse> {
    const env = await this.http.post<ApiEnvelope<UserResponse>>("/users", { body });
    return unwrap(env);
  }

  async update(id: string, body: UpdateUserRequest): Promise<UserResponse> {
    const env = await this.http.put<ApiEnvelope<UserResponse>>(`/users/${id}`, { body });
    return unwrap(env);
  }

  delete(id: string) {
    return this.http.delete<ApiEnvelope<null>>(`/users/${id}`);
  }
}
