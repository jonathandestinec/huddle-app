import type { ComponentProps, ReactNode } from "react";

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "secondary" | "ghost" | "dark" };

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold",
        "transition-[transform,background-color,opacity] duration-150 ease-out active:scale-[0.97]",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-huddle-yellow text-ink hover:bg-[#ffe04a]",
        variant === "secondary" && "border border-ink/15 bg-surface text-ink hover:border-ink/30",
        variant === "ghost" && "text-ink hover:bg-ink/5",
        variant === "dark" && "bg-ink text-paper hover:bg-ink/90",
        className,
      )}
    />
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-slate">{hint}</span>}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-xl border border-ink/15 bg-surface px-4 py-3 outline-none transition-colors",
        "placeholder:text-slate/60 focus:border-ink",
        className,
      )}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-xl border border-ink/15 bg-surface px-4 py-3 outline-none transition-colors focus:border-ink",
        className,
      )}
    />
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cx("rounded-3xl bg-surface p-6 shadow-[0_1px_2px_rgba(26,26,26,0.06)]", className)} />;
}

export { cx };
