"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card, buttonClass } from "@/components/ui";
import { endEventAction, publishEventAction } from "@/lib/events/actions";
import { formatNaira } from "@/lib/money";
import { playSound } from "@/lib/sound";

export function SharePanel({
  eventId,
  status,
  publicUrl,
  hasFunctions,
  hasPicker,
  overview,
}: {
  eventId: string;
  status: "draft" | "published" | "ended";
  publicUrl: string;
  hasFunctions: boolean;
  hasPicker: boolean;
  overview: { registrations: number; numbersTaken: number; revenueKobo: number };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    playSound("pop");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-5">
      {status === "draft" ? (
        <Card className="text-center">
          <h2 className="font-serif text-3xl">Ready to open it up?</h2>
          <p className="mx-auto mt-2 max-w-md text-slate">
            Right now only you can see this event. Publish it to get a link you can share on WhatsApp, Instagram or in church announcements.
          </p>
          {!hasFunctions && <p className="mt-3 text-sm font-medium text-amber-800">Tip: you haven&apos;t added anything for people yet (step 2).</p>}
          <Button
            size="lg"
            className="mt-6 w-full sm:w-auto"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await publishEventAction(eventId);
                playSound("pop");
                router.refresh();
              })
            }
          >
            {pending ? "Publishing…" : "Publish event"}
          </Button>
        </Card>
      ) : (
        <Card>
          <h2 className="font-serif text-3xl">{status === "ended" ? "This event has ended" : "Your event is live 🎉"}</h2>
          <p className="mt-1 text-slate">Share this link — anyone with it can join.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={publicUrl} onFocus={(e) => e.currentTarget.select()} className="min-h-12 flex-1 rounded-[14px] bg-paper px-4 text-[0.95rem]" aria-label="Event link" />
            <Button onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              className={buttonClass("secondary")}
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`Join us: ${publicUrl}`)}`}
            >
              Share on WhatsApp
            </a>
            <a className={buttonClass("ghost")} href={publicUrl} target="_blank" rel="noopener noreferrer">
              See what people see ↗
            </a>
          </div>
        </Card>
      )}

      {status === "published" && hasPicker && (
        <Link href={`/dashboard/events/${eventId}/live`} className="flex items-center gap-4 rounded-[28px] bg-ink p-6 text-white transition-[transform,background-color] duration-300 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/15 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:bg-ink/90">
          <span>
            <span className="block font-serif text-2xl">Host it live</span>
            <span className="text-white/65">Open on the laptop or projector and call numbers out.</span>
          </span>
          <span className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-huddle-yellow text-lg text-ink" aria-hidden>
            →
          </span>
        </Link>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          ["People in", String(overview.registrations)],
          ["Numbers picked", String(overview.numbersTaken)],
          ["Earned", formatNaira(overview.revenueKobo)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-ink/[0.06] bg-surface p-4 sm:p-5">
            <p className="text-sm font-medium text-slate">{label}</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {status === "published" && (
        <div className="pt-4 text-center">
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              confirm("End this event? People keep their recordings, but no new numbers or seats can be taken.") &&
              start(async () => {
                await endEventAction(eventId);
                router.refresh();
              })
            }
          >
            End event
          </Button>
        </div>
      )}
    </div>
  );
}
