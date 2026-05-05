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
    <div className="mx-auto w-full max-w-xl space-y-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-gn-text text-2xl font-semibold">Contact us</h1>
        <p className="text-gn-text-secondary text-sm">
          Fill in the 4 steps below. Your progress is kept until you submit.
        </p>
      </header>
      <Stepper current={step} />
      <div className="border-gn-border bg-gn-surface rounded-lg border p-4 sm:p-6">
        {step === 1 && <StepPersonalInfo />}
        {step === 2 && <StepPreferences />}
        {step === 3 && <StepDocuments />}
        {step === 4 && <StepReview />}
      </div>
    </div>
  );
}
