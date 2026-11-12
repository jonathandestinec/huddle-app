"use client";
import { useState } from "react";
import { cx } from "@/components/ui";

export type StepId = "details" | "functions" | "share";

const STEPS: { id: StepId; label: string; short: string }[] = [
  { id: "details", label: "Details", short: "Details" },
  { id: "functions", label: "What people get", short: "Functions" },
  { id: "share", label: "Share & host", short: "Share" },
];

/** One step at a time, one column — no side-by-side scrolling. The step lives in the URL so refresh keeps it. */
export function EditorSteps({
  initial,
  counts,
  details,
  functions,
  share,
}: {
  initial: StepId;
  counts: { functions: number };
  details: React.ReactNode;
  functions: React.ReactNode;
  share: React.ReactNode;
}) {
  const [step, setStep] = useState<StepId>(initial);
  const go = (id: StepId) => {
    setStep(id);
    const url = new URL(window.location.href);
    url.searchParams.set("step", id);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  };

  return (
    <div>
      <div role="tablist" aria-label="Event steps" className="sticky top-[73px] z-20 -mx-4 mb-6 bg-paper px-4 py-2">
        <div className="grid grid-cols-3 gap-1 rounded-full bg-mist p-1 sm:inline-flex">
        {STEPS.map((s, i) => {
          const on = s.id === step;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={on}
              onClick={() => go(s.id)}
              className={cx(
                "flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-[0.95rem] font-medium transition-[background-color,color] duration-200 sm:shrink-0 sm:justify-start sm:gap-2 sm:px-4",
                on ? "bg-ink text-white" : "text-slate [@media(hover:hover)]:hover:text-ink",
              )}
            >
              <span className={cx("flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200", on ? "bg-huddle-yellow text-ink" : "bg-surface/70")}>{i + 1}</span>
              <span className="sm:hidden">{s.short}</span>
              <span className="hidden sm:inline">{s.label}</span>
              {s.id === "functions" && counts.functions > 0 && <span className="hidden text-sm opacity-70 sm:inline">({counts.functions})</span>}
            </button>
          );
        })}
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div hidden={step !== "details"}>{details}</div>
        <div hidden={step !== "functions"}>{functions}</div>
        <div hidden={step !== "share"}>{share}</div>
        <div className="mt-8 flex justify-between">
          {step !== "details" ? (
            <button type="button" onClick={() => go(step === "share" ? "functions" : "details")} className="min-h-12 font-semibold text-slate">
              ← Back
            </button>
          ) : (
            <span />
          )}
          {step !== "share" && (
            <button type="button" onClick={() => go(step === "details" ? "functions" : "share")} className="min-h-12 rounded-full px-1 font-semibold text-ink/85">
              Next: {step === "details" ? "What people get" : "Share & host"} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
