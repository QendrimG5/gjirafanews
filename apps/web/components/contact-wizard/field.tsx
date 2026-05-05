"use client";

import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
};

export function Field({ label, error, children, htmlFor }: FieldProps) {
  return (
    <label className="block space-y-1.5" htmlFor={htmlFor}>
      <span className="text-gn-text text-sm font-medium">{label}</span>
      {children}
      {error && (
        <span className="text-gn-danger block text-xs" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
