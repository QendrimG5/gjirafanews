# Multi-Step Form Wizard — Implementation Plan

## Overview

A 4-step contact form at `/contact` that collects personal info, user-type-dependent preferences, document uploads with drag-and-drop preview, and a review/edit screen before submission. The wizard is fully client-side for navigation and validation, then submits once at the end via a Server Action.

The route will live at:

```
apps/gjirafa-news/app/contact/
```

---

## Stack notes (this repo, not generic Next.js)

- **Next.js 16.2.1 + React 19.2.4** are installed. We can use `useActionState`, `useFormStatus`, and the `action` prop on `<form>` natively — no extra libraries for forms.
- **`zod` is NOT yet a dependency** of `apps/gjirafa-news`. We need to add it:
  ```bash
  pnpm --filter @gjirafanews/gjirafa-news add zod
  ```
  Suggestion: keep the schemas in a separate file so they can be imported by both the client (live validation) and the server action (defense-in-depth re-validation). Zod v4 ships ESM-only and tree-shakes well — safe to import the same schema from both sides.
- **`zustand` is already installed.** We'll use it for wizard state so navigating between steps (and the "Edit" buttons on the review screen) preserves data without prop-drilling. Alternative: a single `useReducer` inside a top-level client component. Zustand is preferred here because the file upload previews in Step 3 need to survive re-renders without re-reading the File objects.
- **No `react-hook-form` / `react-dropzone`** — we'll implement drag-and-drop with the native `dragenter` / `dragover` / `drop` events (small surface, no dep).
- **AGENTS.md warns the Next.js APIs differ from training data.** Two relevant deltas I already verified in `node_modules/next/dist/docs/`:
  - `useActionState` is the React 19 hook (NOT the deprecated `useFormState` from `react-dom`).
  - `refresh()` now comes from `next/cache` (was `router.refresh()` in older Next). `revalidatePath` / `redirect` still work as expected.

---

## File structure

```
apps/gjirafa-news/
├── app/
│   └── contact/
│       ├── page.tsx                         ← Server Component shell + <WizardProvider>
│       ├── layout.tsx                       ← Optional: sets metadata, centers the card
│       └── actions.ts                       ← 'use server' — submitContactForm
├── components/
│   └── contact-wizard/
│       ├── index.tsx                        ← Orchestrator: renders current step + stepper
│       ├── stepper.tsx                      ← Progress indicator (1 ─ 2 ─ 3 ─ 4)
│       ├── step-personal-info.tsx           ← Step 1
│       ├── step-preferences.tsx             ← Step 2 (conditional fields)
│       ├── step-documents.tsx               ← Step 3 (dropzone + preview)
│       ├── step-review.tsx                  ← Step 4 (summary + per-section edit)
│       ├── field.tsx                        ← Reusable <Field> with error slot
│       └── nav-buttons.tsx                  ← Back / Next / Submit
└── lib/
    └── contact-wizard/
        ├── store.ts                         ← zustand store (state + setters + navigation)
        └── schema.ts                        ← zod schemas per step + combined schema
```

Comment on layout: placing the `store` under `lib/contact-wizard/` (not inside `components/`) keeps the schemas importable from the Server Action in `app/contact/actions.ts` without pulling in any React code. Server Actions can't transitively import `"use client"` modules cleanly, so keep schemas pure.

---

## State shape

```ts
// lib/contact-wizard/store.ts
import { create } from "zustand";

export type UserType = "individual" | "business" | "student";

export type PersonalInfo = {
  name: string;
  email: string;
  phone: string;
};

export type Preferences = {
  userType: UserType | "";
  // individual
  newsletter?: boolean;
  // business
  companyName?: string;
  vatNumber?: string;
  // student
  university?: string;
  graduationYear?: string;
};

export type UploadedDoc = {
  id: string;           // crypto.randomUUID() — stable key for re-renders
  file: File;           // kept as File so we can FormData.append it at submit time
  previewUrl: string;   // URL.createObjectURL(file) — revoked on remove/unmount
  name: string;
  sizeBytes: number;
  mime: string;
};

export type Step = 1 | 2 | 3 | 4;

type WizardState = {
  step: Step;
  personal: PersonalInfo;
  preferences: Preferences;
  documents: UploadedDoc[];
  errors: Partial<Record<string, string[]>>; // field path -> messages

  setStep: (s: Step) => void;
  next: () => void;
  back: () => void;

  setPersonal: (p: Partial<PersonalInfo>) => void;
  setPreferences: (p: Partial<Preferences>) => void;
  addDocuments: (files: File[]) => void;
  removeDocument: (id: string) => void;

  setErrors: (e: WizardState["errors"]) => void;
  reset: () => void;
};
```

Suggestions:
- **Do NOT persist to `localStorage`** for this feature — the `File` objects can't be serialized, and partially restoring without the files would confuse the review screen. If persistence is ever needed, persist only steps 1 & 2 and force re-upload.
- Call `URL.revokeObjectURL(previewUrl)` in `removeDocument` and on unmount to avoid memory leaks.

---

## Zod schemas

```ts
// lib/contact-wizard/schema.ts
import { z } from "zod";

// ---- Step 1 ----
export const personalInfoSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  // Loose international-friendly phone regex; tighten if we only serve one region.
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number"),
});

// ---- Step 2 (conditional) ----
// Using a discriminated union is the idiomatic Zod pattern for "select -> dependent
// fields appear". It gives us exhaustive typing on the consumer side.
export const preferencesSchema = z.discriminatedUnion("userType", [
  z.object({
    userType: z.literal("individual"),
    newsletter: z.boolean().default(false),
  }),
  z.object({
    userType: z.literal("business"),
    companyName: z.string().trim().min(2, "Company name is required"),
    vatNumber: z
      .string()
      .trim()
      .regex(/^[A-Z]{2}[0-9A-Z]{2,12}$/, "Enter a valid VAT number"),
  }),
  z.object({
    userType: z.literal("student"),
    university: z.string().trim().min(2, "University is required"),
    graduationYear: z
      .string()
      .regex(/^\d{4}$/, "Enter a 4-digit year")
      .refine((y) => {
        const n = Number(y);
        return n >= 1950 && n <= new Date().getFullYear() + 10;
      }, "Year is out of range"),
  }),
]);

// ---- Step 3 ----
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const;

export const documentFileSchema = z
  .instanceof(File, { message: "Invalid file" })
  .refine((f) => f.size > 0, "File is empty")
  .refine((f) => f.size <= MAX_FILE_BYTES, "File must be ≤ 5 MB")
  .refine(
    (f) => (ALLOWED_MIME as readonly string[]).includes(f.type),
    "Allowed: PNG, JPEG, WEBP, PDF",
  );

export const documentsSchema = z
  .array(documentFileSchema)
  .min(1, "Upload at least one document")
  .max(5, "Maximum 5 documents");

// ---- Final combined schema used by the Server Action ----
export const contactSubmissionSchema = z.object({
  personal: personalInfoSchema,
  preferences: preferencesSchema,
  // documents are appended as FormData entries and re-validated server-side
});

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;
```

Comment: `z.instanceof(File)` works in both browser and Node ≥ 20 (which Next 16 requires). If we ever need to validate inside an edge runtime that lacks `File`, swap to duck-typing (`{ size: number; type: string; arrayBuffer(): Promise<ArrayBuffer> }`).

---

## Step 1 — Personal Info

```tsx
// components/contact-wizard/step-personal-info.tsx
"use client";

import { useWizard } from "@/lib/contact-wizard/store";
import { personalInfoSchema } from "@/lib/contact-wizard/schema";
import { Field } from "./field";
import { NavButtons } from "./nav-buttons";

export function StepPersonalInfo() {
  const { personal, setPersonal, next, errors, setErrors } = useWizard();

  function handleNext() {
    const parsed = personalInfoSchema.safeParse(personal);
    if (!parsed.success) {
      // .flatten().fieldErrors gives { name: [...], email: [...] }
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setErrors({});
    next();
  }

  return (
    <div className="space-y-4">
      <Field label="Name" error={errors.name?.[0]}>
        <input
          value={personal.name}
          onChange={(e) => setPersonal({ name: e.target.value })}
          className="w-full rounded border px-3 py-2"
        />
      </Field>
      <Field label="Email" error={errors.email?.[0]}>
        <input
          type="email"
          value={personal.email}
          onChange={(e) => setPersonal({ email: e.target.value })}
          className="w-full rounded border px-3 py-2"
        />
      </Field>
      <Field label="Phone" error={errors.phone?.[0]}>
        <input
          type="tel"
          value={personal.phone}
          onChange={(e) => setPersonal({ phone: e.target.value })}
          className="w-full rounded border px-3 py-2"
        />
      </Field>
      <NavButtons onNext={handleNext} />
    </div>
  );
}
```

Suggestion: validate on `onBlur` too (not just on Next) so the user gets feedback without clicking through. Implementation: run `personalInfoSchema.shape[name].safeParse(value)` per field. Skip if it adds complexity you don't want.

---

## Step 2 — Preferences (conditional fields)

```tsx
// components/contact-wizard/step-preferences.tsx
"use client";

import { useWizard } from "@/lib/contact-wizard/store";
import { preferencesSchema } from "@/lib/contact-wizard/schema";
import { Field } from "./field";
import { NavButtons } from "./nav-buttons";

export function StepPreferences() {
  const { preferences, setPreferences, next, back, errors, setErrors } = useWizard();

  function handleNext() {
    const parsed = preferencesSchema.safeParse(preferences);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setErrors({});
    next();
  }

  return (
    <div className="space-y-4">
      <Field label="I am a..." error={errors.userType?.[0]}>
        <select
          value={preferences.userType}
          onChange={(e) => setPreferences({ userType: e.target.value as never })}
          className="w-full rounded border px-3 py-2"
        >
          <option value="">Select…</option>
          <option value="individual">Individual</option>
          <option value="business">Business</option>
          <option value="student">Student</option>
        </select>
      </Field>

      {/* Conditional rendering driven by userType. Each branch renders only the fields
          the discriminated union requires. Fields are uncontrolled across branches,
          so switching userType intentionally clears dependent state (see store note). */}
      {preferences.userType === "individual" && (
        <Field label="Subscribe to newsletter">
          <input
            type="checkbox"
            checked={!!preferences.newsletter}
            onChange={(e) => setPreferences({ newsletter: e.target.checked })}
          />
        </Field>
      )}

      {preferences.userType === "business" && (
        <>
          <Field label="Company name" error={errors.companyName?.[0]}>
            <input
              value={preferences.companyName ?? ""}
              onChange={(e) => setPreferences({ companyName: e.target.value })}
              className="w-full rounded border px-3 py-2"
            />
          </Field>
          <Field label="VAT number" error={errors.vatNumber?.[0]}>
            <input
              value={preferences.vatNumber ?? ""}
              onChange={(e) => setPreferences({ vatNumber: e.target.value })}
              className="w-full rounded border px-3 py-2"
            />
          </Field>
        </>
      )}

      {preferences.userType === "student" && (
        <>
          <Field label="University" error={errors.university?.[0]}>
            <input
              value={preferences.university ?? ""}
              onChange={(e) => setPreferences({ university: e.target.value })}
              className="w-full rounded border px-3 py-2"
            />
          </Field>
          <Field label="Graduation year" error={errors.graduationYear?.[0]}>
            <input
              inputMode="numeric"
              value={preferences.graduationYear ?? ""}
              onChange={(e) => setPreferences({ graduationYear: e.target.value })}
              className="w-full rounded border px-3 py-2"
            />
          </Field>
        </>
      )}

      <NavButtons onBack={back} onNext={handleNext} />
    </div>
  );
}
```

Suggestion for the store: when `setPreferences({ userType })` changes the type, wipe sibling fields (`companyName`, `vatNumber`, etc.) to avoid a stale "business" VAT number sneaking into a "student" submission after a user switches. Do NOT call `setErrors({})` on every field edit — only on successful validation transitions, so errors don't flicker.

---

## Step 3 — Documents (drag & drop + preview)

```tsx
// components/contact-wizard/step-documents.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { useWizard } from "@/lib/contact-wizard/store";
import { documentsSchema } from "@/lib/contact-wizard/schema";
import { NavButtons } from "./nav-buttons";

export function StepDocuments() {
  const { documents, addDocuments, removeDocument, next, back, errors, setErrors } =
    useWizard();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke preview URLs when the component unmounts (the store also revokes on remove).
  useEffect(() => {
    return () => {
      for (const d of documents) URL.revokeObjectURL(d.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    addDocuments(Array.from(fileList));
  }

  function handleNext() {
    const parsed = documentsSchema.safeParse(documents.map((d) => d.file));
    if (!parsed.success) {
      setErrors({ documents: parsed.error.flatten().formErrors });
      return;
    }
    setErrors({});
    next();
  }

  return (
    <div className="space-y-4">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          // preventDefault is required for the drop event to fire.
          e.preventDefault();
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
      >
        <p>Drop files here or click to browse</p>
        <p className="text-sm text-gray-500">PNG, JPEG, WEBP, PDF — up to 5MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {errors.documents?.map((msg, i) => (
        <p key={i} className="text-sm text-red-600">{msg}</p>
      ))}

      <ul className="grid grid-cols-3 gap-3">
        {documents.map((d) => (
          <li key={d.id} className="relative rounded border p-2">
            {d.mime.startsWith("image/") ? (
              // Thumbnail for images; for PDFs show an icon + filename.
              <img
                src={d.previewUrl}
                alt={d.name}
                className="h-24 w-full rounded object-cover"
              />
            ) : (
              <div className="flex h-24 items-center justify-center bg-gray-100">
                <span className="text-xs">📄 PDF</span>
              </div>
            )}
            <p className="mt-1 truncate text-xs">{d.name}</p>
            <button
              type="button"
              onClick={() => removeDocument(d.id)}
              className="absolute right-1 top-1 rounded bg-black/60 px-1 text-xs text-white"
              aria-label={`Remove ${d.name}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <NavButtons onBack={back} onNext={handleNext} />
    </div>
  );
}
```

Suggestions:
- For PDFs, rendering the first page as an image would require `pdfjs-dist`. Not worth it for this feature — the filename + icon is clearer than a thumbnail most users won't recognize.
- If we ever want chunked/resumable uploads, swap the single Server Action submission for a pre-signed S3-style flow. For now, FormData + a single POST is fine for up to 5 × 5MB = 25MB.

---

## Step 4 — Review & Submit

```tsx
// components/contact-wizard/step-review.tsx
"use client";

import { useActionState } from "react";
import { useWizard } from "@/lib/contact-wizard/store";
import { submitContactForm, type SubmitState } from "@/app/contact/actions";
import { NavButtons } from "./nav-buttons";

const initialState: SubmitState = { ok: false, message: "" };

export function StepReview() {
  const { personal, preferences, documents, setStep, reset } = useWizard();
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);

  // Build FormData imperatively because File objects live in zustand state,
  // not inside a <form> DOM tree. We wrap formAction in a submit handler that
  // assembles the payload right before invoking the Server Action.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("personal", JSON.stringify(personal));
    fd.set("preferences", JSON.stringify(preferences));
    for (const d of documents) fd.append("documents", d.file, d.name);
    // Pass the assembled FormData through React's action plumbing so we still
    // get the pending state from useActionState.
    formAction(fd);
  }

  if (state.ok) {
    // Success screen. reset() clears the store so a back-button navigation
    // doesn't show the previous submission's data.
    return (
      <div className="space-y-3 text-center">
        <h2 className="text-xl font-semibold">Thanks — we got your message.</h2>
        <p>{state.message}</p>
        <button onClick={reset} className="rounded bg-blue-600 px-4 py-2 text-white">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Personal info" onEdit={() => setStep(1)}>
        <dl className="grid grid-cols-2 gap-1 text-sm">
          <dt>Name</dt><dd>{personal.name}</dd>
          <dt>Email</dt><dd>{personal.email}</dd>
          <dt>Phone</dt><dd>{personal.phone}</dd>
        </dl>
      </Section>

      <Section title="Preferences" onEdit={() => setStep(2)}>
        <pre className="text-xs">{JSON.stringify(preferences, null, 2)}</pre>
      </Section>

      <Section title={`Documents (${documents.length})`} onEdit={() => setStep(3)}>
        <ul className="text-sm">
          {documents.map((d) => <li key={d.id}>{d.name} — {(d.sizeBytes / 1024).toFixed(1)} KB</li>)}
        </ul>
      </Section>

      {state.message && !state.ok && (
        <p className="text-sm text-red-600" aria-live="polite">{state.message}</p>
      )}

      <NavButtons
        onBack={() => setStep(3)}
        submitLabel="Submit"
        pending={pending}
        isSubmit
      />
    </form>
  );
}

function Section({ title, onEdit, children }: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <button type="button" onClick={onEdit} className="text-sm text-blue-600 underline">
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}
```

Comment on the "Edit" buttons: they simply call `setStep(n)` — the store already holds the values, so the target step's inputs will be pre-populated automatically. No extra plumbing.

---

## Server Action

```ts
// app/contact/actions.ts
"use server";

import { z } from "zod";
import {
  personalInfoSchema,
  preferencesSchema,
  documentFileSchema,
} from "@/lib/contact-wizard/schema";

export type SubmitState = { ok: boolean; message: string };

export async function submitContactForm(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  // Defense in depth: never trust client-side validation.
  // Parse the JSON-encoded fields, then validate the uploaded Files directly.
  try {
    const personal = personalInfoSchema.parse(
      JSON.parse(String(formData.get("personal") ?? "{}")),
    );
    const preferences = preferencesSchema.parse(
      JSON.parse(String(formData.get("preferences") ?? "{}")),
    );
    const files = formData.getAll("documents").filter((v): v is File => v instanceof File);
    const documents = z.array(documentFileSchema).min(1).max(5).parse(files);

    // TODO: persist — e.g. write to SQLite (dev.db already exists in the repo) or
    // forward to an email/ticketing service. Keep this out of scope for the plan.
    // For now, just log server-side so we can verify the roundtrip.
    console.log("[contact] submission", {
      personal,
      preferences,
      docCount: documents.length,
    });

    return { ok: true, message: "We'll reply within 2 business days." };
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Flatten so the client can show a single message; field-level
      // re-display on the review screen isn't required by the spec.
      return { ok: false, message: err.issues[0]?.message ?? "Validation failed" };
    }
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
```

Suggestions:
- If the action ever does a DB write or external API call, wrap it in a try/catch that distinguishes "retryable" (network) from "permanent" (validation) errors, and reflect that in `SubmitState`.
- Consider rate-limiting (IP-based, short TTL) — contact endpoints are spam magnets. Out of scope here but worth a ticket.

---

## Orchestrator + page

```tsx
// components/contact-wizard/index.tsx
"use client";

import { useWizard } from "@/lib/contact-wizard/store";
import { Stepper } from "./stepper";
import { StepPersonalInfo } from "./step-personal-info";
import { StepPreferences } from "./step-preferences";
import { StepDocuments } from "./step-documents";
import { StepReview } from "./step-review";

export function ContactWizard() {
  const step = useWizard((s) => s.step);
  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <Stepper current={step} />
      {step === 1 && <StepPersonalInfo />}
      {step === 2 && <StepPreferences />}
      {step === 3 && <StepDocuments />}
      {step === 4 && <StepReview />}
    </div>
  );
}
```

```tsx
// app/contact/page.tsx
import type { Metadata } from "next";
import { ContactWizard } from "@/components/contact-wizard";

export const metadata: Metadata = {
  title: "Contact — Gjirafa News",
  description: "Get in touch with the Gjirafa News team.",
};

export default function ContactPage() {
  // Server Component on purpose: the page itself has no dynamic server data,
  // so we ship just a thin shell and let the wizard client-bundle handle state.
  return <ContactWizard />;
}
```

---

## Testing plan

1. **Unit tests** (`jest`) for `lib/contact-wizard/schema.ts`:
   - Happy path + at least one rejection per field.
   - Discriminated union: verify that `{ userType: "business", newsletter: true }` is rejected.
   - File schema: oversize file, wrong mime.
2. **Component tests** (`@testing-library/react`) for each step:
   - Step 2: changing `userType` hides/shows the right fields.
   - Step 3: dropping a `DataTransfer` with a PDF adds a preview tile.
3. **E2E** (`playwright`, already configured): golden-path `/contact` → fill all 4 steps → assert success screen.

Suggestion: skip the E2E on CI if it's flaky with file drag-and-drop; Playwright's `setInputFiles` on the hidden `<input type="file">` is more reliable than simulated drops.

---

## Implementation order (reviewable commits)

1. Install `zod` + add `lib/contact-wizard/schema.ts` + unit tests.
2. Add the zustand store + unit tests for navigation transitions.
3. Add `app/contact/page.tsx` + `components/contact-wizard/{index,stepper,field,nav-buttons}.tsx` (empty steps).
4. Implement Step 1 + Step 2 (easiest, pure inputs + conditional render).
5. Implement Step 3 (dropzone + previews) — separate commit so reviewers can focus on the File lifecycle.
6. Implement Step 4 + the Server Action.
7. Wire tests, update README.

Open questions to confirm before coding:
- Where should submissions land? (DB table? email? ticketing tool?) — the plan currently just `console.log`s.
- Are the three user types (`individual`, `business`, `student`) the final set, or is this placeholder copy?
- Max file count / size: 5 × 5MB is a guess — flag if we need to change.
