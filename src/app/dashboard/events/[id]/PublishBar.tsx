"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { endEventAction, publishEventAction } from "@/lib/events/actions";

export function PublishBar({
  eventId,
  status,
  publicUrl,
  title,
}: {
  eventId: string;
  status: "draft" | "published" | "ended";
  publicUrl: string;
  title: string;
}) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink p-5 text-paper">
      <div>
        <p className="text-xs uppercase tracking-wide text-paper/60">
          {status === "draft" ? "Draft — only you can see it" : status === "published" ? "Live" : "Ended"}
        </p>
        <p className="font-serif text-2xl">{title}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {status !== "draft" && (
          <>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(publicUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied ✓" : "Copy link"}
            </Button>
            <Link href={`/dashboard/events/${eventId}/live`} className="rounded-full bg-paper px-5 py-3 text-sm font-bold text-ink">
              Host live
            </Link>
          </>
        )}
        <a href={publicUrl} target="_blank" className="rounded-full px-5 py-3 text-sm font-bold text-paper underline">
          Preview
        </a>
        {status === "draft" && (
          <Button disabled={pending} onClick={() => start(async () => void (await publishEventAction(eventId)))}>
            {pending ? "Publishing…" : "Publish"}
          </Button>
        )}
        {status === "published" && (
          <Button variant="ghost" className="text-paper hover:bg-paper/10" disabled={pending}
            onClick={() => confirm("End this event? People keep access to content, but numbers and seats lock.") && start(async () => void (await endEventAction(eventId)))}>
            End event
          </Button>
        )}
      </div>
    </div>
  );
}
