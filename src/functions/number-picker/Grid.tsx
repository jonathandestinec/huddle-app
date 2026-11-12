"use client";
import { memo, useState } from "react";
import { cx } from "@/components/ui";

const PAGE = 100;

type CellState = "free" | "taken" | "mine" | "pending" | "called";

const Cell = memo(function Cell({ n, state, disabled, onPick }: { n: number; state: CellState; disabled: boolean; onPick: (n: number) => void }) {
  const inert = disabled || state === "taken" || state === "mine";
  return (
    <button
      type="button"
      disabled={inert}
      onClick={() => onPick(n)}
      aria-label={`Number ${n}${state === "taken" ? ", taken" : state === "mine" ? ", yours" : ""}`}
      className={cx(
        "flex h-12 items-center justify-center rounded-xl text-base font-semibold tabular-nums",
        "transition-[transform,background-color] duration-150 ease-out",
        state === "free" && !disabled && "bg-paper active:scale-95 [@media(hover:hover)]:hover:bg-huddle-yellow/50",
        state === "free" && disabled && "bg-paper text-ink/50",
        state === "taken" && "bg-ink/[0.04] text-ink/25",
        state === "mine" && "bg-huddle-yellow ring-2 ring-inset ring-ink",
        state === "pending" && "animate-pulse bg-huddle-yellow/70",
        state === "called" && "bg-ink text-paper",
      )}
    >
      {n}
    </button>
  );
});

/**
 * Number grid. No inner scrolling (a scroll box inside the page traps thumbs on phones);
 * big ranges are split into pages of 100 with simple tabs instead.
 */
export function Grid({
  min,
  max,
  taken,
  mine,
  pending,
  called,
  disabled,
  onPick,
}: {
  min: number;
  max: number;
  taken: Set<number>;
  mine: number | null;
  pending: number | null;
  called: number | null;
  disabled: boolean;
  onPick: (n: number) => void;
}) {
  const pages: number[] = [];
  for (let start = min; start <= max; start += PAGE) pages.push(start);
  const pageOf = (n: number | null) => (n == null ? min : min + Math.floor((n - min) / PAGE) * PAGE);
  const [page, setPage] = useState(() => pageOf(mine));
  const end = Math.min(page + PAGE - 1, max);
  const stateOf = (n: number): CellState =>
    n === mine ? "mine" : n === pending ? "pending" : n === called ? "called" : taken.has(n) ? "taken" : "free";

  return (
    <div>
      {pages.length > 1 && (
        <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Number ranges">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={p === page}
              onClick={() => setPage(p)}
              className={cx(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors",
                p === page ? "bg-ink text-paper" : "bg-ink/5 text-ink/70",
              )}
            >
              {p}–{Math.min(p + PAGE - 1, max)}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: end - page + 1 }, (_, i) => page + i).map((n) => (
          <Cell key={n} n={n} state={stateOf(n)} disabled={disabled} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}
