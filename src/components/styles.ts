/** Style helpers usable from both server and client components (no "use client"). */

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "danger";

export const buttonClass = (variant: ButtonVariant = "primary", size: "md" | "lg" = "md") =>
  cx(
    "inline-flex select-none items-center justify-center gap-2 rounded-[14px] font-bold",
    size === "lg" ? "min-h-14 px-7 text-[1.05rem]" : "min-h-12 px-5 text-[0.95rem]",
    "transition-[transform,background-color,border-color,opacity] duration-150 ease-[var(--ease-out)] active:scale-[0.97]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
    "disabled:pointer-events-none disabled:opacity-45",
    variant === "primary" && "bg-huddle-yellow text-ink [@media(hover:hover)]:hover:bg-[#ffdf3d]",
    variant === "secondary" && "border-2 border-ink/12 bg-surface text-ink [@media(hover:hover)]:hover:border-ink/30",
    variant === "ghost" && "text-ink [@media(hover:hover)]:hover:bg-ink/5",
    variant === "dark" && "bg-ink text-paper [@media(hover:hover)]:hover:bg-ink/85",
    variant === "danger" && "text-red-700 [@media(hover:hover)]:hover:bg-red-50",
  );
