import { HttpClient } from "./client";
import type {
  InitiateMultipartUploadRequest,
  InitiateMultipartUploadResponse,
  CompleteMultipartUploadRequest,
  CompleteMultipartUploadResponse,
  AbortMultipartUploadRequest,
} from "./types";

export class UploadsApi {
  constructor(private readonly http: HttpClient) {}

  initMultipart(body: InitiateMultipartUploadRequest) {
    return this.http.post<InitiateMultipartUploadResponse>(
      "/api/uploads/multipart/init",
      { body },
    );
  }

  completeMultipart(body: CompleteMultipartUploadRequest) {
    return this.http.post<CompleteMultipartUploadResponse>(
      "/api/uploads/multipart/complete",
      { body },
    );
  }

  abortMultipart(body: AbortMultipartUploadRequest) {
    return this.http.post<void>("/api/uploads/multipart/abort", { body });
  }
}
