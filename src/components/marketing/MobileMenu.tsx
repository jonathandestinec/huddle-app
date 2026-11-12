"use client";
import { useEffect, useId, useState } from "react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#benefits", label: "Benefits" },
  { href: "#how", label: "How Huddle works?" },
  { href: "#pricing", label: "Pricing" },
];

/** The section links for screens where the full nav doesn't fit. Closes on choice, Escape, or tapping outside. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-mobile-menu]")) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div className="xl:hidden" data-mobile-menu>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen(!open)}
        className="flex h-[44px] w-[44px] items-center justify-center rounded-full transition-colors duration-150 hover:bg-ink/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/20"
      >
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
          <path
            d={open ? "M4 1l14 14M18 1L4 15" : "M1 2h20M1 8h20M1 14h20"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="transition-[d] duration-200"
          />
        </svg>
      </button>
      <div
        id={id}
        hidden={!open}
        className="absolute inset-x-3 top-[calc(100%-6px)] origin-top animate-[sheet-in_220ms_var(--ease-drawer)] rounded-[28px] bg-ink p-3 text-[19px] text-white shadow-[0_18px_40px_-18px_rgba(26,26,26,0.45)]"
      >
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[52px] items-center rounded-[20px] px-5 transition-colors duration-150 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
