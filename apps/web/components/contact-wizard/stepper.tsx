"use client";

import type { Step } from "@/lib/contact-wizard/store";

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Personal" },
  { n: 2, label: "Preferences" },
  { n: 3, label: "Documents" },
  { n: 4, label: "Review" },
];

export function Stepper({ current }: { current: Step }) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {STEPS.map(({ n, label }, i) => {
        const done = n < current;
        const active = n === current;
        return (
          <li key={n} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                active
                  ? "bg-gn-accent text-gn-text-inverse"
                  : done
                    ? "bg-gn-accent-muted text-gn-accent"
                    : "bg-gn-overlay text-gn-text-tertiary"
              }`}
            >
              {n}
            </span>
            <span
              className={`hidden text-sm sm:inline ${
                active ? "text-gn-text font-medium" : "text-gn-text-tertiary"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="bg-gn-border-light h-px flex-1" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
