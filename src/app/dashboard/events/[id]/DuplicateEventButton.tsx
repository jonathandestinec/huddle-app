"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import type { ButtonVariant } from "@/components/styles";
import { duplicateEventAction } from "@/lib/events/actions";
import { playSound } from "@/lib/sound";

/** Copies this event as a new draft and opens it on the Details step, ready for a new date. */
export function DuplicateEventButton({
  eventId,
  label = "Duplicate",
  variant = "secondary",
  size = "md",
  className,
}: {
  eventId: string;
  label?: string;
  variant?: ButtonVariant;
  size?: "md" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(undefined);
            const r = await duplicateEventAction(eventId);
            if (!r.ok) {
              playSound("bonk");
              setError(r.error);
              return;
            }
            playSound("pop");
            router.push(`/dashboard/events/${r.data.id}?step=details&copied=1`);
          })
        }
      >
        {pending ? "Copying…" : label}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-medium text-[#b4483c]">
          {error}
        </span>
      )}
    </span>
  );
}
