/** Style helpers usable from both server and client components (no "use client"). */

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "danger";

export const buttonClass = (variant: ButtonVariant = "primary", size: "md" | "lg" = "md") =>
  cx(
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold",
    size === "lg" ? "min-h-14 px-7 text-[1.05rem]" : "min-h-12 px-5 text-[0.95rem]",
    "transition-[transform,background-color,border-color,box-shadow,opacity] duration-200 ease-[var(--ease-out)] active:scale-[0.97]",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/15",
    "disabled:pointer-events-none disabled:opacity-45",
    variant === "primary" && "bg-huddle-yellow text-ink [@media(hover:hover)]:hover:bg-huddle-yellow-deep",
    variant === "secondary" && "border-[1.5px] border-ink/20 bg-surface text-ink [@media(hover:hover)]:hover:border-ink/40",
    variant === "ghost" && "text-ink [@media(hover:hover)]:hover:bg-mist",
    variant === "dark" && "bg-ink/90 text-paper [@media(hover:hover)]:hover:bg-ink/80",
    variant === "danger" && "text-[#b4483c] [@media(hover:hover)]:hover:bg-[#b4483c]/[0.06]",
  );
