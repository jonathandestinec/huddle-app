"use client";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui";
import { AttendeeShell, type ShellFunction } from "../AttendeeShell";
import { reserveSeatAction } from "./actions";

export function RsvpCard({
  fn,
  unlocked,
  hasSeat,
  seatsLeft,
  ended,
}: {
  fn: ShellFunction;
  unlocked: boolean;
  hasSeat: boolean;
  seatsLeft: number | null;
  ended: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const full = seatsLeft === 0;
  const left = seatsLeft == null ? null : `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`;

  return (
    <AttendeeShell
      fn={fn}
      unlocked={unlocked && hasSeat}
      freeCta="Reserve my seat"
      paidCta={undefined}
      onFree={() => reserveSeatAction(fn.id)}
      hideUnlock={ended || full || (unlocked && !hasSeat)}
      lockedBody={
        <div className="text-sm text-slate">
          {ended ? "This event has ended." : full ? "This one's full." : (left ?? "Save your spot.")}
          {unlocked && !hasSeat && !full && !ended && (
            <Button
              className="mt-3 w-full"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await reserveSeatAction(fn.id);
                  if (!r.ok) setError(r.error);
                  else router.refresh();
                })
              }
            >
              Reserve my seat
            </Button>
          )}
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </div>
      }
    >
      <p className="font-serif text-2xl">You&apos;re on the list ✓</p>
      {left && <p className="text-sm text-slate">{left}</p>}
    </AttendeeShell>
  );
}
