"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { createEventAction, updateEventAction } from "@/lib/events/actions";
import { playSound } from "@/lib/sound";
import { uploadFile } from "@/lib/storage/upload-client";

type Values = {
  title: string;
  description: string;
  startsAtLocal: string;
  endsAtLocal: string;
  venue: string;
  meetingUrl: string;
  coverKey?: string;
};

export function EventForm({ eventId, initial }: { eventId?: string; initial?: Values }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(
    initial ?? { title: "", description: "", startsAtLocal: "", endsAtLocal: "", venue: "", meetingUrl: "" },
  );
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSaved(false);
    setV({ ...v, [k]: e.target.value });
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    start(async () => {
      try {
        const coverKey = cover ? await uploadFile(cover, "covers") : v.coverKey;
        const input = { ...v, coverKey, endsAtLocal: v.endsAtLocal || undefined };
        if (eventId) {
          const r = await updateEventAction(eventId, input);
          if (!r.ok) return (playSound("bonk"), setError(r.error));
          playSound("pop");
          setSaved(true);
          router.refresh();
        } else {
          const r = await createEventAction(input);
          if (!r.ok) return (playSound("bonk"), setError(r.error));
          router.push(`/dashboard/events/${r.data.id}?step=functions`);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="space-y-5">
        <h2 className="font-serif text-2xl">The basics</h2>
        <Field label="What's it called?">
          <Input required value={v.title} onChange={set("title")} placeholder="Sunday Service" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="When does it start?" hint="Nigeria time">
            <Input type="datetime-local" required value={v.startsAtLocal} onChange={set("startsAtLocal")} />
          </Field>
          <Field label="When does it end?" hint="Optional">
            <Input type="datetime-local" value={v.endsAtLocal} onChange={set("endsAtLocal")} />
          </Field>
        </div>
        <Field label="Tell people about it" hint="Optional — a sentence or two is plenty.">
          <Textarea rows={4} value={v.description} onChange={set("description")} />
        </Field>
      </Card>

      <Card className="space-y-5">
        <h2 className="font-serif text-2xl">Where</h2>
        <Field label="Venue" hint="Optional — leave empty for online-only events.">
          <Input value={v.venue} onChange={set("venue")} placeholder="Main auditorium, Ikeja" />
        </Field>
        <Field label="Online meeting link" hint="Optional — Zoom, YouTube Live, Google Meet or Teams.">
          <Input type="url" inputMode="url" value={v.meetingUrl} onChange={set("meetingUrl")} placeholder="https://" />
        </Field>
        <Field label="Cover picture" hint="Optional — JPG or PNG, shown at the top of your event page.">
          <Input type="file" accept="image/png,image/jpeg" className="py-3" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
        </Field>
      </Card>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-800">
          {error}
        </p>
      )}

      <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-[18px] bg-paper/95 p-2 shadow-[0_8px_24px_rgba(26,26,26,0.08)] backdrop-blur sm:static sm:bg-transparent sm:p-0 sm:shadow-none">
        <Button type="submit" size="lg" disabled={pending} className="flex-1 sm:flex-none">
          {pending ? "Saving…" : eventId ? "Save changes" : "Create event"}
        </Button>
        {saved && <span className="pr-2 font-medium text-emerald-800">Saved ✓</span>}
      </div>
    </form>
  );
}
