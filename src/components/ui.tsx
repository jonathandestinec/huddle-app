"use client";
import type { ComponentProps, ReactNode } from "react";
import { playSound } from "@/lib/sound";
import { buttonClass, cx, type ButtonVariant } from "./styles";

/*
 * Huddle's one system: one button family, one field style, one card, one radius scale
 * (field/button 14px, card 24px). Every control is at least 48px tall — easy to hit for everyone.
 */

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: "md" | "lg" };

export function Button({ variant = "primary", size = "md", className, onPointerDown, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      onPointerDown={(e) => {
        // Main actions get a soft tap; secondary buttons stay silent so it never gets noisy.
        if (variant === "primary" || variant === "dark") playSound("tap");
        onPointerDown?.(e);
      }}
      className={cx(buttonClass(variant, size), className)}
    />
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="block text-sm text-slate">{hint}</span>}
      {error && (
        <span role="alert" className="block text-sm font-medium text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}

const fieldClass =
  "w-full rounded-[14px] border-2 border-ink/12 bg-surface px-4 outline-none transition-colors placeholder:text-slate/55 focus:border-ink";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cx(fieldClass, "min-h-12 py-2.5", className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(fieldClass, "py-3 leading-relaxed", className)} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cx(fieldClass, "min-h-12 py-2.5", className)} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cx("rounded-3xl bg-surface p-5 shadow-[0_1px_2px_rgba(26,26,26,0.06)] sm:p-7", className)} />;
}

/** Choose-one control: big, labelled options instead of a cramped segmented switch. */
export function Choice<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (v: T) => void;
  name: string;
  options: { value: T; label: string; hint?: string; disabled?: boolean; disabledHint?: ReactNode }[];
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex min-h-12 flex-col items-start rounded-[14px] border-2 px-4 py-3 text-left transition-colors duration-150",
              on ? "border-ink bg-huddle-yellow/35" : "border-ink/12 bg-surface [@media(hover:hover)]:hover:border-ink/30",
              o.disabled && "cursor-not-allowed opacity-45",
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className={cx("h-4 w-4 rounded-full border-2", on ? "border-ink bg-ink shadow-[inset_0_0_0_2px_#fff]" : "border-ink/30")} />
              {o.label}
            </span>
            {(o.disabled ? o.disabledHint : o.hint) && <span className="mt-0.5 pl-6 text-sm text-slate">{o.disabled ? o.disabledHint : o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function StatusPill({ status }: { status: "draft" | "published" | "ended" }) {
  const map = { draft: ["Draft", "bg-ink/8 text-ink"], published: ["Live", "bg-emerald-100 text-emerald-900"], ended: ["Ended", "bg-ink/8 text-slate"] } as const;
  const [label, cls] = map[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", cls)}>
      {status === "published" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
      {label}
    </span>
  );
}

export { buttonClass, cx };
