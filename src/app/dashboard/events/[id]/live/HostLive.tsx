"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button, cx } from "@/components/ui";
import type { HostState } from "@/functions/number-picker/host";
import { callNextNumberAction, callNumberAction, uncallNumberAction } from "@/functions/number-picker/host-actions";
import { useLive } from "@/lib/realtime";
import { playSound } from "@/lib/sound";

type Serialised = Omit<HostState, "claims"> & { claims: (Omit<HostState["claims"][number], "calledAt"> & { calledAt: string | Date | null })[] };

export function HostLive({ functionId, eventId, title, initial }: { functionId: string; eventId: string; title: string; initial: Serialised }) {
  const { data, refresh } = useLive<Serialised>(`/api/functions/${functionId}/host-state`, 2000, initial);
  const state = data ?? initial;
  const [present, setPresent] = useState(false);
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [pending, start] = useTransition();
  const byNumber = useMemo(() => new Map(state.claims.map((c) => [c.number, c])), [state.claims]);
  const picked = state.claims.filter((c) => c.status === "confirmed");
  const waiting = picked.filter((c) => !c.calledAt).length;
  const calledEntry = state.called != null ? byNumber.get(state.called) : undefined;

  const run = (fn: () => Promise<{ ok: true; data: unknown } | { ok: false; error: string }>, onData?: (d: unknown) => void) =>
    start(async () => {
      setError(undefined);
      setInfo(undefined);
      const r = await fn();
      if (!r.ok) {
        playSound("bonk");
        setError(r.error);
      } else onData?.(r.data);
      refresh();
    });

  const callNext = () => {
    playSound("tap");
    run(() => callNextNumberAction(functionId), (n) => n == null && setInfo("Everyone who picked a number has been called."));
  };

  const banner = (big: boolean) => (
    <div className={cx("rounded-[28px] text-center text-ink", big ? "bg-surface p-10" : "border border-ink/[0.12] bg-surface p-8")} aria-live="polite">
      <p className="text-[0.95rem] font-medium text-ink/60">Now calling</p>
      <p key={state.called ?? "none"} className="animate-[sheet-in_300ms_var(--ease-drawer)] font-serif text-[clamp(5rem,18vw,14rem)] leading-none tabular-nums">
        {state.called ?? "—"}
      </p>
      {calledEntry?.name && !big && <p className="mt-2 text-lg text-ink/70">{calledEntry.name}</p>}
    </div>
  );

  if (present) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-huddle-yellow p-8">
        <p className="font-serif text-4xl">{title}</p>
        <div className="w-full max-w-4xl">{banner(true)}</div>
        <div className="flex gap-3">
          <Button variant="dark" size="lg" onClick={callNext} disabled={pending || waiting === 0}>
            Call next number
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setPresent(false)}>
            Exit full screen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/events/${eventId}?step=share`} className="inline-flex min-h-12 items-center font-semibold text-slate">
          ← Back to event
        </Link>
        <h1 className="font-serif text-[2.4rem] leading-none sm:text-5xl">{title}</h1>
        <p className="mt-2 text-slate">
          {picked.length} {picked.length === 1 ? "person has" : "people have"} picked a number
          {state.anonymous ? " (anonymous)" : state.hideIdentity ? " (names hidden)" : ""} · {waiting} still waiting
        </p>
      </div>

      {banner(false)}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Button size="lg" onClick={callNext} disabled={pending || waiting === 0}>
          {waiting === 0 ? "No one waiting" : "Call next number"}
        </Button>
        {state.called != null && (
          <Button variant="secondary" size="lg" disabled={pending} onClick={() => run(() => uncallNumberAction(functionId, state.called!))}>
            Undo last call
          </Button>
        )}
        <Button variant="secondary" size="lg" onClick={() => setPresent(true)}>
          Show full screen
        </Button>
      </div>

      {error && <p role="alert" className="rounded-2xl bg-[#b4483c]/[0.08] px-4 py-3 font-medium text-[#8f3328]">{error}</p>}
      {info && <p className="rounded-2xl bg-mist px-4 py-3 font-medium text-ink">{info}</p>}

      <section>
        <h2 className="mb-3 text-[0.95rem] font-medium text-slate">Or tap a number to call it</h2>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: state.max - state.min + 1 }, (_, i) => state.min + i).map((n) => {
            const c = byNumber.get(n);
            const isCalled = state.called === n;
            return (
              <button
                key={n}
                type="button"
                disabled={!c || c.status !== "confirmed" || pending}
                onClick={() => {
                  playSound("tap");
                  run(() => callNumberAction(functionId, n));
                }}
                title={c?.name ? `${c.name}${c.email ? ` · ${c.email}` : ""}` : undefined}
                aria-label={`Number ${n}${c ? (c.name ? `, ${c.name}` : ", picked") : ", free"}`}
                className={cx(
                  "flex min-h-14 flex-col items-center justify-center rounded-xl p-1 font-semibold tabular-nums transition-transform duration-150 active:scale-95",
                  !c && "bg-mist/70 text-ink/45",
                  c?.status === "held" && "bg-mist text-ink/40",
                  c?.status === "confirmed" && !isCalled && (c.calledAt ? "bg-huddle-yellow/45" : "bg-huddle-yellow"),
                  isCalled && "bg-ink/85 text-paper",
                )}
              >
                {n}
                {c?.status === "confirmed" && c.name && <span className="w-full truncate text-[11px] font-normal">{c.name.split(" ")[0]}</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-slate">Bright yellow: waiting · Pale yellow: already called · Grey: nobody picked it</p>
      </section>
    </div>
  );
}
