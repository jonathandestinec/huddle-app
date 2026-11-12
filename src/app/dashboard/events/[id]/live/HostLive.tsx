"use client";
import { useMemo, useState, useTransition } from "react";
import { Button, cx } from "@/components/ui";
import { callNumberAction, uncallNumberAction } from "@/functions/number-picker/host-actions";
import type { HostState } from "@/functions/number-picker/host";
import { useLive } from "@/lib/realtime";
import { playSound } from "@/lib/sound";

type Serialised = Omit<HostState, "claims"> & { claims: (Omit<HostState["claims"][number], "calledAt"> & { calledAt: string | Date | null })[] };

export function HostLive({ functionId, title, initial }: { functionId: string; title: string; initial: Serialised }) {
  const { data, refresh } = useLive<Serialised>(`/api/functions/${functionId}/host-state`, 2000, initial);
  const state = data ?? initial;
  const [present, setPresent] = useState(false);
  const [error, setError] = useState<string>();
  const [, start] = useTransition();
  const byNumber = useMemo(() => new Map(state.claims.map((c) => [c.number, c])), [state.claims]);
  const calledEntry = state.called != null ? byNumber.get(state.called) : undefined;

  const call = (n: number) => {
    playSound("tap");
    start(async () => {
      setError(undefined);
      const r = await callNumberAction(functionId, n);
      if (!r.ok) {
        playSound("bonk");
        setError(r.error);
      }
      refresh();
    });
  };

  const banner = (
    <div className="rounded-3xl bg-ink p-8 text-center text-paper">
      <p className="text-sm uppercase tracking-[0.2em] text-paper/60">Now calling</p>
      <p key={state.called ?? "none"} className="animate-[sheet-in_300ms_cubic-bezier(0.32,0.72,0,1)] font-serif text-[clamp(5rem,18vw,14rem)] leading-none">
        {state.called != null ? `#${state.called}` : "—"}
      </p>
      {calledEntry && !present && <p className="mt-2 text-paper/70">{calledEntry.name}</p>}
    </div>
  );

  if (present) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-huddle-yellow p-8" onClick={() => setPresent(false)}>
        <p className="mb-6 font-serif text-3xl italic">{title}</p>
        <div className="w-full max-w-4xl">{banner}</div>
        <p className="mt-6 text-sm">Tap anywhere to exit</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate">Host live</p>
          <h1 className="font-serif text-4xl">{title}</h1>
        </div>
        <div className="flex gap-2">
          {state.called != null && (
            <Button variant="secondary" onClick={() => start(async () => void (await uncallNumberAction(functionId, state.called!), refresh()))}>
              Undo call
            </Button>
          )}
          <Button variant="dark" onClick={() => setPresent(true)}>
            Present
          </Button>
        </div>
      </div>
      {banner}
      <p className="text-sm text-slate">
        {state.claims.filter((c) => c.status === "confirmed").length} numbers taken · Tap a taken number to call it
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: state.max - state.min + 1 }, (_, i) => state.min + i).map((n) => {
          const c = byNumber.get(n);
          const isCalled = state.called === n;
          return (
            <button
              key={n}
              type="button"
              disabled={!c || c.status !== "confirmed"}
              onClick={() => call(n)}
              title={c ? `${c.name} · ${c.email}` : undefined}
              className={cx(
                "flex aspect-square flex-col items-center justify-center rounded-xl p-1 text-sm font-semibold tabular-nums transition-transform duration-150 active:scale-90",
                !c && "bg-paper text-ink/25",
                c?.status === "held" && "bg-ink/5 text-ink/40",
                c?.status === "confirmed" && !isCalled && "bg-huddle-yellow hover:scale-105",
                isCalled && "bg-ink text-paper",
                c?.calledAt && !isCalled && "opacity-60",
              )}
            >
              {n}
              {c?.status === "confirmed" && <span className="w-full truncate text-[10px] font-normal">{c.name.split(" ")[0]}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
