"use client";

import { useRef, useState, useEffect } from "react";
import { useWizard } from "@/lib/contact-wizard/store";
import { documentsSchema, FILE_LIMITS } from "@/lib/contact-wizard/schema";
import { NavButtons } from "./nav-buttons";

export function StepDocuments() {
  const documents = useWizard((s) => s.documents);
  const errors = useWizard((s) => s.errors);
  const addDocuments = useWizard((s) => s.addDocuments);
  const removeDocument = useWizard((s) => s.removeDocument);
  const setErrors = useWizard((s) => s.setErrors);
  const next = useWizard((s) => s.next);
  const back = useWizard((s) => s.back);
  const isEditing = useWizard((s) => s.returnTo !== null);

  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      for (const d of documents) URL.revokeObjectURL(d.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(fileList: FileList | null) {
    console.log(fileList);
    if (!fileList?.length) return;
    addDocuments(Array.from(fileList));
  }

  function handleNext() {
    const parsed = documentsSchema.safeParse(documents.map((d) => d.file));
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const msgs = [
        ...flat.formErrors,
        ...Object.values(flat.fieldErrors).flat().filter(Boolean),
      ] as string[];
      setErrors({ documents: msgs.length ? msgs : ["Invalid files"] });
      return;
    }
    setErrors({});
    next();
  }

  const accept = FILE_LIMITS.allowedMime.join(",");
  const maxMb = Math.round(FILE_LIMITS.maxBytes / (1024 * 1024));

  return (
    <div className="space-y-4">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-gn-accent bg-gn-accent-muted"
            : "border-gn-border bg-gn-surface hover:bg-gn-overlay"
        }`}
      >
        <p className="text-gn-text text-sm font-medium">
          Drop files here or click to browse
        </p>
        <p className="text-gn-text-tertiary mt-1 text-xs">
          Accepted: PNG, JPEG, WEBP, PDF · up to {maxMb} MB each · max 5 files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {errors.documents?.map((msg, i) => (
        <p key={i} className="text-gn-danger text-sm" role="alert">
          {msg}
        </p>
      ))}

      {documents.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {documents.map((d) => (
            <li
              key={d.id}
              className="border-gn-border bg-gn-surface relative overflow-hidden rounded-md border p-2"
            >
              {d.mime.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.previewUrl}
                  alt={d.name}
                  className="h-24 w-full rounded object-cover"
                />
              ) : (
                <div className="bg-gn-overlay text-gn-text-secondary flex h-24 items-center justify-center rounded text-xs font-medium">
                  PDF
                </div>
              )}
              <p className="text-gn-text mt-1 truncate text-xs" title={d.name}>
                {d.name}
              </p>
              <p className="text-gn-text-tertiary text-[10px]">
                {(d.sizeBytes / 1024).toFixed(1)} KB
              </p>
              <button
                type="button"
                onClick={() => removeDocument(d.id)}
                className="bg-gn-primary/70 text-gn-text-inverse hover:bg-gn-primary absolute right-1 top-1 rounded px-1.5 text-xs"
                aria-label={`Remove ${d.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <NavButtons
        onBack={back}
        onNext={handleNext}
        submitLabel={isEditing ? "Save" : "Next"}
      />
    </div>
  );
}
