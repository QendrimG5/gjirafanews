"use client";

import { useWizard } from "@/lib/contact-wizard/store";
import { personalInfoSchema } from "@/lib/contact-wizard/schema";
import { Field } from "./field";
import { NavButtons } from "./nav-buttons";

const inputCls =
  "border-gn-border bg-gn-surface text-gn-text placeholder:text-gn-text-tertiary focus:border-gn-accent focus:ring-gn-accent/20 w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2";

export function StepPersonalInfo() {
  const personal = useWizard((s) => s.personal);
  const errors = useWizard((s) => s.errors);
  const setPersonal = useWizard((s) => s.setPersonal);
  const setErrors = useWizard((s) => s.setErrors);
  const next = useWizard((s) => s.next);
  const back = useWizard((s) => s.back);
  const isEditing = useWizard((s) => s.returnTo !== null);

  function handleNext() {
    const parsed = personalInfoSchema.safeParse(personal);
    if (!parsed.success) {
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
          className={inputCls}
          placeholder="e.g. Jane Doe (2–80 characters)"
          value={personal.name}
          onChange={(e) => setPersonal({ name: e.target.value })}
          autoComplete="name"
        />
      </Field>
      <Field label="Email" error={errors.email?.[0]}>
        <input
          type="email"
          className={inputCls}
          placeholder="name@example.com"
          value={personal.email}
          onChange={(e) => setPersonal({ email: e.target.value })}
          autoComplete="email"
        />
      </Field>
      <Field label="Phone" error={errors.phone?.[0]}>
        <input
          type="tel"
          className={inputCls}
          placeholder="+383 44 123 456"
          value={personal.phone}
          onChange={(e) => setPersonal({ phone: e.target.value })}
          autoComplete="tel"
        />
      </Field>
      <NavButtons
        onBack={isEditing ? back : undefined}
        onNext={handleNext}
        submitLabel={isEditing ? "Save" : "Next"}
      />
    </div>
  );
}
