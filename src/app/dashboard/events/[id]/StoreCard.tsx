"use client";
import { useState } from "react";
import { FunctionEditor, type EditorFunction } from "@/functions/FunctionEditor";
import { cx } from "@/components/ui";

const gateBadge = { free: "Free", paid: "Paid", code: "Code" } as const;

export function StoreCard({
  eventId,
  hasBank,
  label,
  description,
  emoji,
  initial,
  extra,
}: {
  eventId: string;
  hasBank: boolean;
  label: string;
  description: string;
  emoji: string;
  initial: EditorFunction;
  extra?: React.ReactNode;
}) {
  const added = !!initial.id;
  const [open, setOpen] = useState(false);
  const anonymous = initial.type === "number_picker" && !!initial.config.anonymous;

  return (
    <div className={cx("rounded-3xl bg-surface shadow-[0_1px_2px_rgba(26,26,26,0.06)]", added && "ring-2 ring-ink")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        aria-label={`${label}: ${added ? "change settings" : "add to event"}`}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-huddle-yellow/60 text-2xl" aria-hidden>
          {emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-[1.05rem] font-semibold">
            {label}
            {added && (
              <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-paper">
                ✓ Added · {gateBadge[initial.gate]}
                {anonymous ? " · Anonymous" : ""}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[0.95rem] text-slate">{description}</span>
        </span>
        <span className={cx("shrink-0 rounded-[12px] px-3 py-2 text-sm font-bold", added ? "bg-ink/5" : "bg-huddle-yellow")}>
          {open ? "Close" : added ? "Change" : "Add"}
        </span>
      </button>
      {open && (
        <div className="border-t border-ink/8 px-5 pb-6 pt-5">
          <FunctionEditor eventId={eventId} initial={initial} hasBank={hasBank} onDone={() => !added && setOpen(false)} />
          {extra && <div className="mt-8 border-t border-ink/8 pt-6">{extra}</div>}
        </div>
      )}
    </div>
  );
}
