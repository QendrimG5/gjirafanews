"use client";

import { useWizard, type UserType } from "@/lib/contact-wizard/store";
import { preferencesSchema } from "@/lib/contact-wizard/schema";
import { Field } from "./field";
import { NavButtons } from "./nav-buttons";

const inputCls =
  "border-gn-border bg-gn-surface text-gn-text placeholder:text-gn-text-tertiary focus:border-gn-accent focus:ring-gn-accent/20 w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2";

export function StepPreferences() {
  const preferences = useWizard((s) => s.preferences);
  const errors = useWizard((s) => s.errors);
  const setPreferences = useWizard((s) => s.setPreferences);
  const setErrors = useWizard((s) => s.setErrors);
  const next = useWizard((s) => s.next);
  const back = useWizard((s) => s.back);
  const isEditing = useWizard((s) => s.returnTo !== null);

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
      <Field label="I am a…" error={errors.userType?.[0]}>
        <select
          className={inputCls}
          value={preferences.userType}
          onChange={(e) =>
            setPreferences({ userType: e.target.value as UserType | "" })
          }
        >
          <option value="">Select one…</option>
          <option value="individual">Individual</option>
          <option value="business">Business</option>
          <option value="student">Student</option>
        </select>
      </Field>

      {preferences.userType === "individual" && (
        <Field label="Subscribe to newsletter">
          <label className="text-gn-text-secondary flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-gn-accent h-4 w-4"
              checked={!!preferences.newsletter}
              onChange={(e) => setPreferences({ newsletter: e.target.checked })}
            />
            Send me occasional updates (optional)
          </label>
        </Field>
      )}

      {preferences.userType === "business" && (
        <>
          <Field label="Company name" error={errors.companyName?.[0]}>
            <input
              className={inputCls}
              placeholder="e.g. Acme Ltd. (min. 2 characters)"
              value={preferences.companyName ?? ""}
              onChange={(e) => setPreferences({ companyName: e.target.value })}
            />
          </Field>
          <Field label="VAT number" error={errors.vatNumber?.[0]}>
            <input
              className={inputCls}
              placeholder="e.g. XK12345678 (2 letters + 2–12 alphanumeric)"
              value={preferences.vatNumber ?? ""}
              onChange={(e) =>
                setPreferences({ vatNumber: e.target.value.toUpperCase() })
              }
            />
          </Field>
        </>
      )}

      {preferences.userType === "student" && (
        <>
          <Field label="University" error={errors.university?.[0]}>
            <input
              className={inputCls}
              placeholder="e.g. University of Prishtina"
              value={preferences.university ?? ""}
              onChange={(e) => setPreferences({ university: e.target.value })}
            />
          </Field>
          <Field label="Graduation year" error={errors.graduationYear?.[0]}>
            <input
              inputMode="numeric"
              maxLength={4}
              className={inputCls}
              placeholder="e.g. 2027 (4 digits, 1950–current+10)"
              value={preferences.graduationYear ?? ""}
              onChange={(e) =>
                setPreferences({ graduationYear: e.target.value })
              }
            />
          </Field>
        </>
      )}

      <NavButtons
        onBack={back}
        onNext={handleNext}
        submitLabel={isEditing ? "Save" : "Next"}
      />
    </div>
  );
}
