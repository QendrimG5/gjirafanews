"use client";

import type { ReactNode } from "react";
import { useActionState, startTransition } from "react";
import { useWizard } from "@/lib/contact-wizard/store";
import { submitContactForm, type SubmitState } from "@/app/contact/actions";
import { NavButtons } from "./nav-buttons";

const initialState: SubmitState = { ok: false, message: "" };

export function StepReview() {
  const personal = useWizard((s) => s.personal);
  const preferences = useWizard((s) => s.preferences);
  const documents = useWizard((s) => s.documents);
  const editStep = useWizard((s) => s.editStep);
  const setStep = useWizard((s) => s.setStep);
  const reset = useWizard((s) => s.reset);

  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialState,
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("personal", JSON.stringify(personal));
    fd.set("preferences", JSON.stringify(preferences));
    for (const d of documents) fd.append("documents", d.file, d.name);
    // `formAction` from useActionState must run inside a transition when
    // invoked manually (i.e. not via <form action={formAction}>). Without
    // this wrap, React 19 warns and `pending` won't update correctly.
    startTransition(() => {
      formAction(fd);
    });
  }

  if (state.ok) {
    return (
      <div className="border-gn-border bg-gn-surface space-y-4 rounded-md border p-6 text-center">
        <h2 className="text-gn-text text-xl font-semibold">
          Thanks — we got your message.
        </h2>
        <p className="text-gn-text-secondary text-sm">{state.message}</p>
        <button
          onClick={reset}
          className="bg-gn-accent hover:bg-gn-accent-light text-gn-text-inverse rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Section title="Personal info" onEdit={() => editStep(1)}>
        <dl className="grid grid-cols-[7rem_1fr] gap-y-1 text-sm">
          <dt className="text-gn-text-tertiary">Name</dt>
          <dd className="text-gn-text">{personal.name || "—"}</dd>
          <dt className="text-gn-text-tertiary">Email</dt>
          <dd className="text-gn-text">{personal.email || "—"}</dd>
          <dt className="text-gn-text-tertiary">Phone</dt>
          <dd className="text-gn-text">{personal.phone || "—"}</dd>
        </dl>
      </Section>

      <Section title="Preferences" onEdit={() => editStep(2)}>
        <PreferencesSummary />
      </Section>

      <Section
        title={`Documents (${documents.length})`}
        onEdit={() => editStep(3)}
      >
        {documents.length === 0 ? (
          <p className="text-gn-text-tertiary text-sm">No files uploaded.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex justify-between gap-2">
                <span className="text-gn-text truncate">{d.name}</span>
                <span className="text-gn-text-tertiary">
                  {(d.sizeBytes / 1024).toFixed(1)} KB
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {state.message && !state.ok && (
        <p className="text-gn-danger text-sm" aria-live="polite">
          {state.message}
        </p>
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

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-gn-border bg-gn-surface rounded-md border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-gn-text font-medium">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-gn-accent hover:text-gn-accent-light text-xs font-medium underline-offset-2 hover:underline"
        >
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function PreferencesSummary() {
  const preferences = useWizard((s) => s.preferences);
  if (!preferences.userType) {
    return <p className="text-gn-text-tertiary text-sm">Not set.</p>;
  }
  return (
    <dl className="grid grid-cols-[9rem_1fr] gap-y-1 text-sm">
      <dt className="text-gn-text-tertiary">Type</dt>
      <dd className="text-gn-text capitalize">{preferences.userType}</dd>
      {preferences.userType === "individual" && (
        <>
          <dt className="text-gn-text-tertiary">Newsletter</dt>
          <dd className="text-gn-text">
            {preferences.newsletter ? "Yes" : "No"}
          </dd>
        </>
      )}
      {preferences.userType === "business" && (
        <>
          <dt className="text-gn-text-tertiary">Company</dt>
          <dd className="text-gn-text">{preferences.companyName || "—"}</dd>
          <dt className="text-gn-text-tertiary">VAT</dt>
          <dd className="text-gn-text">{preferences.vatNumber || "—"}</dd>
        </>
      )}
      {preferences.userType === "student" && (
        <>
          <dt className="text-gn-text-tertiary">University</dt>
          <dd className="text-gn-text">{preferences.university || "—"}</dd>
          <dt className="text-gn-text-tertiary">Graduation</dt>
          <dd className="text-gn-text">{preferences.graduationYear || "—"}</dd>
        </>
      )}
    </dl>
  );
}
