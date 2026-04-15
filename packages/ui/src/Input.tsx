/**
 * Input — styled text input with optional label.
 *
 * @prop label     — Text rendered above the input as a <label>. Omit for a standalone input.
 * @prop id        — Ties the label to the input via htmlFor. Pass when using label.
 * @prop className — Extra CSS classes merged onto the <input>.
 * All native <input> attributes (placeholder, value, onChange, type, disabled, etc.) are forwarded.
 *
 * @example
 * // With label
 * <Input label="Titulli" id="title" value={title} onChange={e => setTitle(e.target.value)} />
 *
 * // Without label, custom placeholder
 * <Input placeholder="Kerko..." onChange={handleSearch} />
 *
 * // Password input
 * <Input label="Fjalekalimi" id="password" type="password" />
 *
 * // Disabled with extra class
 * <Input label="Email" id="email" value={email} disabled className="opacity-60" />
 */
"use client";

import { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({
  label,
  className = "",
  id,
  ...props
}: InputProps) {
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
      <input
        id={id}
        className={`w-full px-3 py-2 text-sm border border-gn-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary ${className}`}
        {...props}
      />
    </div>
  );
}
