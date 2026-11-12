"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { startPaidUnlockAction, unlockFreeAction, unlockWithCodeAction } from "@/lib/gating/actions";
import { formatNaira } from "@/lib/money";
import { playSound } from "@/lib/sound";
import { useIdentity } from "./IdentifySheet";
import type { Gate } from "./types";

export type ShellFunction = { id: string; label: string; emoji: string; gate: Gate; priceKobo: number | null };
type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * The common card for every function on the public event page.
 * Handles identity + the three ways in (free / pay / code). Functions supply the body.
 */
export function AttendeeShell({
  fn,
  unlocked,
  children,
  lockedBody,
  freeCta = "Get access",
  paidCta,
  onFree,
  hideUnlock,
  emailOnly,
}: {
  fn: ShellFunction;
  unlocked: boolean;
  children?: React.ReactNode;
  lockedBody?: React.ReactNode;
  freeCta?: string;
  paidCta?: string;
  onFree?: () => Promise<ActionResult>;
  /** Function handles unlocking itself (e.g. Number Picker pays per pick). */
  hideUnlock?: boolean;
  /** Ask only for an email (private Number Picker). */
  emailOnly?: boolean;
}) {
  const router = useRouter();
  const { ensureIdentity } = useIdentity();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const run = async (fnc: () => Promise<ActionResult | { ok: true; data: { authorizationUrl: string } }>) => {
    setError(undefined);
    // Identity first, outside the transition (state set inside an async transition is held until it ends).
    if (!(await ensureIdentity({ emailOnly }))) return;
    start(async () => {
      const r = await fnc();
      if (!r.ok) {
        playSound("bonk");
        return setError(r.error);
      }
      if ("data" in r && r.data?.authorizationUrl) {
        window.location.href = r.data.authorizationUrl;
        return;
      }
      playSound("pop");
      router.refresh();
    });
  };

  const badge = unlocked
    ? "✓ You're in"
    : fn.gate === "paid" && fn.priceKobo
      ? formatNaira(fn.priceKobo)
      : fn.gate === "code"
        ? "🔒 Code"
        : "Free";

  return (
    <section className="rounded-[28px] border border-ink/[0.06] bg-surface p-5">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-huddle-yellow/60 text-2xl" aria-hidden>
          {fn.emoji}
        </span>
        <h2 className="flex-1 text-[1.15rem] font-semibold">{fn.label}</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${unlocked ? "bg-huddle-yellow" : "bg-ink/5"}`}>{badge}</span>
      </header>
      <div className="mt-5">
        {unlocked ? children : lockedBody}
        {!unlocked && !hideUnlock && (
          <div className="mt-4 space-y-2">
            {fn.gate === "free" && (
              <Button size="lg" className="w-full" disabled={pending} onClick={() => run(onFree ?? (() => unlockFreeAction(fn.id)))}>
                {pending ? "One moment…" : freeCta}
              </Button>
            )}
            {fn.gate === "paid" && fn.priceKobo && (
              <Button size="lg" className="w-full" disabled={pending} onClick={() => run(() => startPaidUnlockAction(fn.id))}>
                {pending ? "Opening checkout…" : (paidCta ?? `Unlock for ${formatNaira(fn.priceKobo)}`)}
              </Button>
            )}
            {fn.gate === "code" && (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => unlockWithCodeAction(fn.id, code));
                }}
              >
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter access code" required />
                <Button type="submit" disabled={pending} variant="dark">
                  Unlock
                </Button>
              </form>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 font-medium text-red-800">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
