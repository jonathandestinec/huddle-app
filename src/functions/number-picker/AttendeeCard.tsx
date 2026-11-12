"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { playSound } from "@/lib/sound";
import { useLive } from "@/lib/realtime";
import { formatNaira } from "@/lib/money";
import { AttendeeShell, type ShellFunction } from "../AttendeeShell";
import { useIdentity } from "../IdentifySheet";
import { claimNumberAction } from "./actions";
import { Grid } from "./Grid";
import type { PickerState } from "./logic";

export function NumberPickerCard({
  fn,
  unlocked,
  initial,
  ended,
}: {
  fn: ShellFunction;
  unlocked: boolean;
  initial: PickerState;
  ended: boolean;
}) {
  const { ensureIdentity } = useIdentity();
  const { data, refresh } = useLive<PickerState>(`/api/functions/${fn.id}/state`, 3000, initial);
  const state = data ?? initial;
  const [pendingNumber, setPendingNumber] = useState<number | null>(null);
  const [message, setMessage] = useState<string>();
  const [busy, start] = useTransition();
  const taken = useMemo(() => new Set(state.taken), [state.taken]);
  const mine = state.mine?.status === "confirmed" ? state.mine.number : null;
  const needsCode = fn.gate === "code" && !unlocked;
  const isCalled = mine != null && state.called === mine;
  const wasCalled = useRef(isCalled);
  useEffect(() => {
    // Ding once, the moment *your* number is called.
    if (isCalled && !wasCalled.current) playSound("ding");
    wasCalled.current = isCalled;
  }, [isCalled]);

  async function pick(n: number) {
    if (mine != null || ended || needsCode || busy) return;
    setMessage(undefined);
    // Ask who they are OUTSIDE the transition: React holds transition state updates
    // until the action resolves, so a sheet opened inside it would never render.
    if (!(await ensureIdentity())) return;
    start(async () => {
      setPendingNumber(n);
      const r = await claimNumberAction(fn.id, n);
      if (!r.ok) {
        playSound("bonk");
        setPendingNumber(null);
        setMessage(r.error);
        refresh();
        return;
      }
      if (r.data.status === "held") {
        window.location.href = r.data.authorizationUrl;
        return;
      }
      playSound("pop");
      setPendingNumber(null);
      refresh();
    });
  }

  const instructions = ended
    ? "This event has ended."
    : mine != null
      ? null
      : needsCode
        ? "Enter the access code to pick a number."
        : fn.gate === "paid" && fn.priceKobo && !unlocked
          ? `Tap a free number to claim it for ${formatNaira(fn.priceKobo)}.`
          : "Tap a free number to make it yours.";

  const total = state.max - state.min + 1;
  const grid = (
    <Grid
      min={state.min}
      max={state.max}
      taken={taken}
      mine={mine}
      pending={pendingNumber}
      called={state.called}
      disabled={mine != null || ended || needsCode}
      onPick={pick}
    />
  );

  const body =
    mine != null ? (
      <div className="space-y-4">
        <div
          className={`rounded-2xl px-6 py-7 text-center transition-colors duration-300 ${isCalled ? "bg-ink text-paper" : "bg-huddle-yellow text-ink"}`}
          aria-live="polite"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">{isCalled ? "It's your turn" : "Your number"}</p>
          <p className="mt-1 font-serif text-[5.5rem] leading-none tabular-nums">{mine}</p>
          <p className="mx-auto mt-3 max-w-[16rem] text-sm opacity-80">
            {isCalled ? "The host just called your number. 🎉" : "Keep this page open — it lights up when your number is called."}
          </p>
        </div>
        {state.called != null && !isCalled && (
          <p className="text-center text-sm text-slate">
            Now calling <strong className="text-ink">#{state.called}</strong>
          </p>
        )}
        <details className="group rounded-2xl bg-paper px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
            See all numbers
            <span className="text-slate">
              {state.taken.length} of {total} picked <span className="inline-block transition-transform group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="mt-3">{grid}</div>
        </details>
      </div>
    ) : (
      <div className="space-y-3">
        {state.called != null && (
          <div className="rounded-2xl bg-ink p-4 text-center text-paper">
            <p className="text-xs uppercase tracking-wide opacity-70">Now calling</p>
            <p className="font-serif text-5xl">#{state.called}</p>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3">
          {instructions && <p className="text-sm text-slate">{instructions}</p>}
          <p className="shrink-0 text-xs text-slate tabular-nums">
            {state.taken.length}/{total} picked
          </p>
        </div>
        {message && <p className="text-sm font-semibold text-red-600">{message}</p>}
        {grid}
      </div>
    );

  return (
    <AttendeeShell fn={fn} unlocked={mine != null} hideUnlock={!needsCode} lockedBody={body}>
      {body}
    </AttendeeShell>
  );
}
