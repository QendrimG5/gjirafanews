/**
 * Button — shared button component for the GjirafaNews design system.
 *
 * @prop variant  — Visual style of the button.
 *   "primary" — filled with brand color, inverse text (default)
 *   "danger"  — filled red, white text
 *   "ghost"   — transparent background, subtle hover
 *
 * @prop size — Controls padding and font size.
 *   "sm" — compact (px-3 py-1.5 text-xs)
 *   "md" — standard (px-4 py-2 text-sm) (default)
 *   "lg" — spacious (px-6 py-2.5 text-sm)
 *
 * @prop className — Extra CSS classes merged onto the <button>.
 * All native <button> attributes (onClick, disabled, type, etc.) are forwarded.
 *
 * @example
 * // Primary action
 * <Button onClick={handleSave}>Ruaj</Button>
 *
 * // Small danger button
 * <Button variant="danger" size="sm" onClick={handleDelete}>Fshi</Button>
 *
 * // Ghost button, disabled
 * <Button variant="ghost" disabled>Anulo</Button>
 *
 * // With extra class
 * <Button className="w-full" size="lg">Vazhdo</Button>
 */
"use client";

import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gn-primary text-gn-text-inverse hover:bg-gn-primary-light disabled:opacity-50",
  danger: "bg-gn-danger text-white hover:bg-gn-danger/90 disabled:opacity-50",
  ghost:
    "bg-transparent text-gn-text-secondary hover:bg-gn-overlay hover:text-gn-text disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "!px-3 !py-1.5 !text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 justify-center rounded-lg font-semibold transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
