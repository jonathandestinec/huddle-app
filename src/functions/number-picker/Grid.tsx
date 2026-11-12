"use client";
import { memo } from "react";
import { cx } from "@/components/ui";

const CHUNK = 100;

type CellState = "free" | "taken" | "mine" | "pending" | "called";

const Cell = memo(function Cell({ n, state, disabled, onPick }: { n: number; state: CellState; disabled: boolean; onPick: (n: number) => void }) {
  return (
    <button
      type="button"
      disabled={disabled || state === "taken"}
      onClick={() => onPick(n)}
      aria-label={`Number ${n}${state === "taken" ? ", taken" : state === "mine" ? ", yours" : ""}`}
      className={cx(
        "flex aspect-square items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
        "transition-[transform,background-color] duration-150 ease-out active:scale-90",
        state === "free" && "bg-paper hover:bg-huddle-yellow/50",
        state === "taken" && "bg-ink/5 text-ink/25 line-through",
        state === "mine" && "scale-105 bg-huddle-yellow shadow-[0_0_0_2px_#1A1A1A]",
        state === "pending" && "animate-pulse bg-huddle-yellow/70",
        state === "called" && "bg-ink text-paper",
        disabled && state === "free" && "cursor-default hover:bg-paper",
      )}
    >
      {n}
    </button>
  );
});

/** Numbers grid. Chunks of 100 use content-visibility so 10,000 cells stay smooth on phones. */
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
  const chunks: number[] = [];
  for (let start = min; start <= max; start += CHUNK) chunks.push(start);
  const stateOf = (n: number): CellState =>
    n === mine ? "mine" : n === pending ? "pending" : n === called ? "called" : taken.has(n) ? "taken" : "free";

  return (
    <div className="max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
      {chunks.map((start) => (
        <div key={start} className="mb-2 grid grid-cols-6 gap-1.5 sm:grid-cols-10" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 400px" }}>
          {Array.from({ length: Math.min(CHUNK, max - start + 1) }, (_, i) => start + i).map((n) => (
            <Cell key={n} n={n} state={stateOf(n)} disabled={disabled} onPick={onPick} />
          ))}
        </div>
      ))}
    </div>
  );
}
