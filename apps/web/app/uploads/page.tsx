"use client";

import { useCallback, useRef, useState } from "react";
import {
  uploadFile,
  UploadAbortedError,
  type CompleteResponse,
  type UploadProgress,
} from "@/lib/uploads";

type Status = "idle" | "uploading" | "done" | "error" | "aborted";

export default function UploadsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<CompleteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  async function handleUpload() {
    if (!file) return;
    reset();
    setStatus("uploading");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await uploadFile(file, {
        signal: controller.signal,
        onProgress: setProgress,
      });
      setResult(res);
      setStatus("done");
    } catch (err) {
      if (err instanceof UploadAbortedError) {
        setStatus("aborted");
      } else {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    } finally {
      abortRef.current = null;
    }
  }

  function handleAbort() {
    abortRef.current?.abort();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
    reset();
  }

  const uploading = status === "uploading";
  const percent = progress
    ? Math.round((progress.bytesUploaded / progress.totalBytes) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <header className="mb-6">
        <h1 className="text-gn-text text-2xl font-bold tracking-tight">
          Ngarko skedar
        </h1>
        <p className="text-gn-text-tertiary mt-1 text-sm">
          Skedari ndahet në copëza dhe ngarkohet drejtpërdrejt në S3 me URL të
          paranënshkruara.
        </p>
      </header>

      <div className="bg-gn-surface border-gn-border space-y-4 rounded-xl border p-5 shadow-sm">
        <label className="block">
          <span className="text-gn-text-secondary mb-2 block text-sm font-medium">
            Zgjidh skedarin
          </span>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-gn-text-secondary file:bg-gn-primary file:text-gn-text-inverse hover:file:opacity-90 block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold disabled:opacity-50"
          />
        </label>

        {file && (
          <div className="text-gn-text-tertiary text-sm">
            <div>
              <span className="font-medium">{file.name}</span> ·{" "}
              {formatBytes(file.size)}
              {file.type ? ` · ${file.type}` : ""}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="bg-gn-primary text-gn-text-inverse inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Duke ngarkuar..." : "Ngarko"}
          </button>
          <button
            type="button"
            onClick={handleAbort}
            disabled={!uploading}
            className="text-gn-text-secondary border-gn-border hover:bg-gn-overlay inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Anulo
          </button>
        </div>

        {progress && (
          <div className="space-y-2">
            <div className="bg-gn-overlay h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-gn-primary h-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="text-gn-text-tertiary flex justify-between text-xs tabular-nums">
              <span>
                Pjesa {progress.partNumber}/{progress.partCount}
              </span>
              <span>
                {formatBytes(progress.bytesUploaded)} /{" "}
                {formatBytes(progress.totalBytes)} · {percent}%
              </span>
            </div>
          </div>
        )}

        {status === "done" && result && (
          <div className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-lg border px-4 py-3 text-sm">
            <div className="font-semibold">Ngarkimi u krye.</div>
            <div className="mt-1 break-all">
              <span className="font-medium">key:</span> {result.key}
            </div>
            {result.location && (
              <div className="mt-0.5 break-all">
                <span className="font-medium">location:</span> {result.location}
              </div>
            )}
          </div>
        )}

        {status === "aborted" && (
          <div className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg border px-4 py-3 text-sm">
            Ngarkimi u anulua.
          </div>
        )}

        {status === "error" && error && (
          <div className="border-gn-danger/40 bg-gn-danger/10 text-gn-danger rounded-lg border px-4 py-3 text-sm">
            <div className="font-semibold">Gabim gjatë ngarkimit</div>
            <div className="mt-1 break-all">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}
