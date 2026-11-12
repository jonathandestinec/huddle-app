import Link from "next/link";
import { requireCurrentOrg } from "@/lib/orgs/current";
import { EventForm } from "../EventForm";

export default async function NewEventPage() {
  await requireCurrentOrg();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/events" className="inline-flex min-h-12 items-center font-semibold text-slate">
        ← All events
      </Link>
      <h1 className="mt-1 font-serif text-[2.6rem] leading-none sm:text-5xl">Create an event</h1>
      <p className="mb-8 mt-2 text-slate">Start with a name and a date. Next you&apos;ll choose what people get.</p>
      <EventForm />
    </div>
  );
}
