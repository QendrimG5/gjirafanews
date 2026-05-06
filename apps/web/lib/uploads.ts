// Browser client for the GjirafaNewsAPI multipart upload endpoints. The
// init endpoint returns a presigned PUT URL per part; the browser uploads
// each part directly to S3, then asks the server to finalize.
//
// S3 bucket CORS must allow the frontend origin and expose the `ETag`
// response header — without that, the browser cannot read the part ETag
// needed to complete the upload.

import { env } from "@/lib/env";

const API_URL = env.NEXT_PUBLIC_API_BASE_URL;

// S3 requires every part except the last to be at least 5 MiB.
export const MIN_PART_SIZE = 5 * 1024 * 1024;
export const DEFAULT_PART_SIZE = 8 * 1024 * 1024;
export const MAX_PARTS = 10_000;

export type PresignedPart = { partNumber: number; url: string };

export type InitiateResponse = {
  key: string;
  uploadId: string;
  partUrls: PresignedPart[];
  expiresAt: string;
};

export type CompletedPart = { partNumber: number; eTag: string };

export type CompleteResponse = {
  key: string;
  location: string | null;
  eTag: string | null;
};

export type UploadProgress = {
  partNumber: number;
  partCount: number;
  bytesUploaded: number;
  totalBytes: number;
};

export class UploadAbortedError extends Error {
  constructor() {
    super("Upload aborted");
    this.name = "UploadAbortedError";
  }
}

function planParts(fileSize: number, preferredPartSize: number): number {
  const partSize = Math.max(MIN_PART_SIZE, preferredPartSize);
  const count = Math.max(1, Math.ceil(fileSize / partSize));
  if (count > MAX_PARTS) {
    throw new Error(
      `File requires ${count} parts, exceeds S3 limit of ${MAX_PARTS}.`,
    );
  }
  return count;
}

async function initiate(
  fileName: string,
  contentType: string,
  partCount: number,
  signal: AbortSignal,
): Promise<InitiateResponse> {
  const res = await fetch(`${API_URL}/api/uploads/multipart/init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, contentType, partCount }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`init failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as InitiateResponse;
}

async function complete(
  key: string,
  uploadId: string,
  parts: CompletedPart[],
  signal: AbortSignal,
): Promise<CompleteResponse> {
  const res = await fetch(`${API_URL}/api/uploads/multipart/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, uploadId, parts }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`complete failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as CompleteResponse;
}

async function abort(key: string, uploadId: string): Promise<void> {
  // Best-effort: don't throw if abort itself fails — the original error
  // already happened, and S3 will GC stale uploads via lifecycle rules.
  try {
    await fetch(`${API_URL}/api/uploads/multipart/abort`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, uploadId }),
    });
  } catch {
    /* swallow */
  }
}

function uploadPart(
  url: string,
  blob: Blob,
  signal: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);

    const onAbort = () => xhr.abort();
    if (signal.aborted) {
      reject(new UploadAbortedError());
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });

    xhr.onload = () => {
      signal.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        const eTag = xhr.getResponseHeader("ETag");
        if (!eTag) {
          reject(
            new Error(
              "S3 did not return an ETag header. Check that the bucket CORS exposes 'ETag'.",
            ),
          );
          return;
        }
        resolve(eTag);
      } else {
        reject(new Error(`part PUT failed: ${xhr.status} ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => {
      signal.removeEventListener("abort", onAbort);
      reject(new Error("Network error while uploading part"));
    };
    xhr.onabort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(new UploadAbortedError());
    };

    xhr.send(blob);
  });
}

export type UploadFileOptions = {
  partSize?: number;
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
};

export async function uploadFile(
  file: File,
  options: UploadFileOptions = {},
): Promise<CompleteResponse> {
  const partSize = Math.max(MIN_PART_SIZE, options.partSize ?? DEFAULT_PART_SIZE);
  const partCount = planParts(file.size, partSize);
  const externalSignal = options.signal;
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }
  const signal = controller.signal;

  const init = await initiate(
    file.name,
    file.type || "application/octet-stream",
    partCount,
    signal,
  );

  const completedParts: CompletedPart[] = [];
  let bytesUploaded = 0;

  try {
    for (const presigned of init.partUrls) {
      const start = (presigned.partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      const eTag = await uploadPart(presigned.url, blob, signal);
      completedParts.push({ partNumber: presigned.partNumber, eTag });

      bytesUploaded += blob.size;
      options.onProgress?.({
        partNumber: presigned.partNumber,
        partCount,
        bytesUploaded,
        totalBytes: file.size,
      });
    }

    return await complete(init.key, init.uploadId, completedParts, signal);
  } catch (err) {
    await abort(init.key, init.uploadId);
    throw err;
  } finally {
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}
