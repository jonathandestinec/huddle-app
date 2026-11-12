"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { createEventAction, updateEventAction } from "@/lib/events/actions";
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
  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV({ ...v, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaved(false);
    start(async () => {
      try {
        const coverKey = cover ? await uploadFile(cover, "covers") : v.coverKey;
        const input = { ...v, coverKey, endsAtLocal: v.endsAtLocal || undefined };
        if (eventId) {
          const r = await updateEventAction(eventId, input);
          if (!r.ok) return setError(r.error);
          setSaved(true);
          router.refresh();
        } else {
          const r = await createEventAction(input);
          if (!r.ok) return setError(r.error);
          router.push(`/dashboard/events/${r.data.id}`);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Event title">
        <Input required value={v.title} onChange={set("title")} placeholder="Sunday Service" />
      </Field>
      <Field label="What's it about? (optional)">
        <Textarea rows={4} value={v.description} onChange={set("description")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" hint="Lagos time">
          <Input type="datetime-local" required value={v.startsAtLocal} onChange={set("startsAtLocal")} />
        </Field>
        <Field label="Ends (optional)">
          <Input type="datetime-local" value={v.endsAtLocal} onChange={set("endsAtLocal")} />
        </Field>
      </div>
      <Field label="Venue (optional)">
        <Input value={v.venue} onChange={set("venue")} placeholder="Main auditorium, Ikeja" />
      </Field>
      <Field label="Meeting link (optional)" hint="Zoom, YouTube Live, Google Meet…">
        <Input type="url" value={v.meetingUrl} onChange={set("meetingUrl")} placeholder="https://" />
      </Field>
      <Field label="Cover image (optional)">
        <Input type="file" accept="image/png,image/jpeg" onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : eventId ? "Save changes" : "Create event"}
        </Button>
        {saved && <span className="text-sm text-slate">Saved ✓</span>}
      </div>
    </form>
  );
}
