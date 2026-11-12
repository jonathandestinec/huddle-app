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
  const attached = !!initial.id;
  const [open, setOpen] = useState(false);

  return (
    <div className={cx("rounded-3xl bg-surface p-5 transition-shadow", attached && "ring-2 ring-huddle-yellow")}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-start gap-4 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-huddle-yellow/50 text-xl">{emoji}</span>
        <span className="flex-1">
          <span className="flex items-center gap-2 font-semibold">
            {label}
            {attached && <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] text-paper">{gateBadge[initial.gate]}</span>}
          </span>
          <span className="block text-sm text-slate">{description}</span>
        </span>
        <span className="text-sm font-semibold">{attached ? (open ? "Close" : "Edit") : open ? "Close" : "Attach +"}</span>
      </button>
      {open && (
        <div className="mt-5 border-t border-ink/10 pt-5">
          <FunctionEditor eventId={eventId} initial={initial} hasBank={hasBank} onDone={() => !attached && setOpen(false)} />
          {extra && <div className="mt-6 border-t border-ink/10 pt-5">{extra}</div>}
        </div>
      )}
    </div>
  );
}
