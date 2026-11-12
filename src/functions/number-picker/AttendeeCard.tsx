"use client";
import { useMemo, useState, useTransition } from "react";
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
        setPendingNumber(null);
        setMessage(r.error);
        refresh();
        return;
      }
      if (r.data.status === "held") {
        window.location.href = r.data.authorizationUrl;
        return;
      }
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

  const body = (
      <div className="space-y-3">
        {state.called != null && (
          <div className={`rounded-2xl p-4 text-center ${isCalled ? "animate-pulse bg-huddle-yellow" : "bg-ink text-paper"}`}>
            <p className="text-xs uppercase tracking-wide opacity-70">Now calling</p>
            <p className="font-serif text-5xl">#{state.called}</p>
            {isCalled && <p className="mt-1 font-bold">That&apos;s you! 🎉</p>}
          </div>
        )}
        {mine != null && (
          <p className="text-center">
            Your number is <span className="font-serif text-4xl">#{mine}</span>
          </p>
        )}
        {instructions && <p className="text-sm text-slate">{instructions}</p>}
        {message && <p className="text-sm font-semibold text-red-600">{message}</p>}
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
      </div>
  );

  return (
    <AttendeeShell fn={fn} unlocked={mine != null} hideUnlock={!needsCode} lockedBody={body}>
      {body}
    </AttendeeShell>
  );
}
