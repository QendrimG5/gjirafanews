"use client";

type NavButtonsProps = {
  onBack?: () => void;
  onNext?: () => void;
  submitLabel?: string;
  pending?: boolean;
  isSubmit?: boolean;
};

const primaryCls =
  "bg-gn-accent hover:bg-gn-accent-light text-gn-text-inverse rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60";
const secondaryCls =
  "border-gn-border text-gn-text hover:bg-gn-overlay rounded-md border px-4 py-2 text-sm transition-colors disabled:opacity-40";

export function NavButtons({
  onBack,
  onNext,
  submitLabel = "Next",
  pending = false,
  isSubmit = false,
}: NavButtonsProps) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack || pending}
        className={secondaryCls}
      >
        Back
      </button>
      {isSubmit ? (
        <button type="submit" disabled={pending} className={primaryCls}>
          {pending ? "Submitting…" : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={pending}
          className={primaryCls}
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
