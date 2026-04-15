/**
 * Select — styled dropdown with optional label.
 *
 * @prop label     — Text rendered above the select as a <label>. Omit for a standalone dropdown.
 * @prop id        — Ties the label to the select via htmlFor. Pass when using label.
 * @prop className — Extra CSS classes merged onto the <select>.
 * @prop children  — <option> elements to render inside the dropdown.
 * All native <select> attributes (value, onChange, disabled, etc.) are forwarded.
 *
 * @example
 * // Basic usage with label
 * <Select label="Kategoria" id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
 *   <option value="">Zgjidh kategorine</option>
 *   <option value="1">Politike</option>
 *   <option value="2">Sport</option>
 * </Select>
 *
 * // Without label
 * <Select value={sort} onChange={e => setSort(e.target.value)}>
 *   <option value="newest">Me te rejat</option>
 *   <option value="oldest">Me te vjetrat</option>
 * </Select>
 *
 * // Disabled state
 * <Select label="Burimi" id="source" disabled>
 *   <option>Duke ngarkuar...</option>
 * </Select>
 */
"use client";

import { type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export default function Select({
  label,
  className = "",
  id,
  children,
  ...props
}: SelectProps) {
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
      <select
        id={id}
        className={`w-full px-3 py-2 text-sm border border-gn-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gn-primary/20 focus:border-gn-primary ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
