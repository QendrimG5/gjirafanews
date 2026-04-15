/**
 * Textarea — styled multi-line text input with optional label.
 *
 * @prop label     — Text rendered above the textarea as a <label>. Omit for a standalone textarea.
 * @prop id        — Ties the label to the textarea via htmlFor. Pass when using label.
 * @prop className — Extra CSS classes merged onto the <textarea>.
 * All native <textarea> attributes (rows, placeholder, value, onChange, disabled, etc.) are forwarded.
 *
 * @example
 * // With label and rows
 * <Textarea label="Permbajtja" id="content" rows={6} value={content} onChange={e => setContent(e.target.value)} />
 *
 * // With placeholder, no label
 * <Textarea placeholder="Shkruaj permbledhjen..." rows={3} />
 *
 * // Disabled
 * <Textarea label="Shenime" id="notes" disabled value="Vetem per lexim" />
 */
"use client";

import { type TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export default function Textarea({
  label,
  className = "",
  id,
  ...props
}: TextareaProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gn-text-secondary"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full px-3 py-2 text-sm border border-gn-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary ${className}`}
        {...props}
      />
    </div>
  );
}
