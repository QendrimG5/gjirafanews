import type { ApiEnvelope } from "./types";

export type ApiErrorDetail = { field?: string | null; message: string };

/**
 * Thrown for any non-2xx response. The .NET API uses two response shapes:
 *   - Raw DTO (most controllers): error body is `{ error: "..." }` or
 *     a ProblemDetails-style object.
 *   - ApiResponse<T> envelope (UsersController): `{ success, data, message,
 *     errors }`.
 *
 * `parseError` normalizes both into an ApiError with `details`.
 */
export class ApiError extends Error {
  status: number;
  details: ApiErrorDetail[];
  body: unknown;

  constructor(status: number, message: string, details: ApiErrorDetail[], body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.body = body;
  }
}

export async function parseError(response: Response): Promise<ApiError> {
  let body: unknown = null;
  let text = "";
  try {
    text = await response.text();
    if (text) body = JSON.parse(text);
  } catch {
    body = text || null;
  }

  const fallbackMessage = `${response.status} ${response.statusText}`.trim();

  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;

    // ApiResponse<T> envelope
    if ("success" in obj && obj.success === false) {
      const env = obj as ApiEnvelope<unknown>;
      const details =
        env.errors?.map((e) => ({ field: e.field, message: e.message })) ?? [];
      return new ApiError(response.status, env.message ?? fallbackMessage, details, body);
    }

    // ProblemDetails or { error: "..." }
    const message =
      (typeof obj.error === "string" && obj.error) ||
      (typeof obj.title === "string" && obj.title) ||
      (typeof obj.detail === "string" && obj.detail) ||
      fallbackMessage;
    return new ApiError(response.status, message, [], body);
  }

  return new ApiError(response.status, text || fallbackMessage, [], body);
}
