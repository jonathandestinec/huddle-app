"use client";
import { pickerMode } from "@/functions/number-picker/config";
import { useState } from "react";
import { FunctionEditor, type EditorFunction } from "@/functions/FunctionEditor";
import { cx } from "@/components/ui";

const gateBadge = { free: "Free", paid: "Paid", code: "Code" } as const;

export function StoreCard({
  eventId,
  hasBank,
  label,
  description,
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
  const mode = initial.type === "number_picker" ? pickerMode(initial.config) : null;

  return (
    <div className={cx("rounded-[28px] border transition-colors duration-300", added ? "border-ink/80 bg-huddle-yellow/20" : "border-ink/[0.12] bg-surface")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        aria-label={`${label}: ${added ? "change settings" : "add to event"}`}
        className="flex w-full items-center gap-4 rounded-[28px] p-5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/15 sm:px-6"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-[1.05rem] font-semibold">
            {label}
            {added && (
              <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">
                ✓ Added · {gateBadge[initial.gate]}
                {mode === "anonymous" ? " · Anonymous" : mode === "private" ? " · Email only" : ""}
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-[0.95rem] text-slate">{description}</span>
        </span>
        <span className={cx("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", added ? "bg-surface text-ink" : "bg-huddle-yellow")}>
          {open ? "Close" : added ? "Change" : "Add"}
        </span>
      </button>
      {open && (
        <div className="rounded-b-[27px] border-t border-ink/10 bg-surface px-5 pb-6 pt-5">
          <FunctionEditor eventId={eventId} initial={initial} hasBank={hasBank} onDone={() => !added && setOpen(false)} />
          {extra && <div className="mt-8 border-t border-ink/[0.12] pt-6">{extra}</div>}
        </div>
      )}
    </div>
  );
}
