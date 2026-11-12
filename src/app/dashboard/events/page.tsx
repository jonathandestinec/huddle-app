import Link from "next/link";
import { Penguin } from "@/components/Penguin";
import { buttonClass } from "@/components/styles";
import { StatusPill } from "@/components/ui";
import { listOrgEventsWithCounts } from "@/lib/events/service";
import { formatEventTime } from "@/lib/events/time";
import { requireCurrentOrg } from "@/lib/orgs/current";

function nextStep(e: { status: "draft" | "published" | "ended"; functionCount: number }) {
  if (e.status === "ended") return "Finished — recordings stay available to people who unlocked them.";
  if (e.functionCount === 0) return "Next: choose what people get (numbers, seats, content).";
  if (e.status === "draft") return "Next: publish it so people can join.";
  return "Live — share the link and host it.";
}

export default async function EventsPage() {
  const { org } = await requireCurrentOrg();
  const events = await listOrgEventsWithCounts(org.id);
  const upcoming = events.filter((e) => e.status !== "ended");
  const past = events.filter((e) => e.status === "ended");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[2.6rem] leading-none sm:text-5xl">Your events</h1>
          <p className="mt-2 text-slate">Create an event, choose what people get, then share the link.</p>
        </div>
        <Link href="/dashboard/events/new" className={buttonClass("primary", "lg")}>
          + Create an event
        </Link>
      </div>

      {!org.paystackSubaccountCode && (
        <Link
          href="/dashboard/onboarding/bank"
          className="flex items-center gap-4 rounded-[28px] bg-mist p-5 transition-colors duration-200 [@media(hover:hover)]:hover:bg-[#ecebe6]"
        >
          <span>
            <span className="block font-semibold">Want to charge for anything?</span>
            <span className="text-slate">Add your bank account first — it takes a minute.</span>
          </span>
          <span className="ml-auto text-slate" aria-hidden>
            →
          </span>
        </Link>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center rounded-[28px] border border-ink/[0.06] bg-surface px-6 py-16 text-center">
          <Penguin mood="wave" size={120} />
          <h2 className="mt-5 font-serif text-3xl">No events yet</h2>
          <p className="mt-2 max-w-sm text-slate">Your first one takes about two minutes. Add a title and a date — you can change anything later.</p>
          <Link href="/dashboard/events/new" className={`${buttonClass("primary", "lg")} mt-6`}>
            Create your first event
          </Link>
        </div>
      ) : (
        <>
          <EventList title="Coming up" events={upcoming} />
          {past.length > 0 && <EventList title="Past events" events={past} />}
        </>
      )}
    </div>
  );
}

function EventList({ title, events }: { title: string; events: Awaited<ReturnType<typeof listOrgEventsWithCounts>> }) {
  if (!events.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-[0.95rem] font-medium text-slate">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {events.map((e) => (
          <li key={e.id}>
            <Link
              href={`/dashboard/events/${e.id}`}
              className="block h-full rounded-[28px] border border-ink/[0.06] bg-surface p-6 transition-[transform,border-color] duration-300 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/15 [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:border-ink/15"
            >
              <div className="flex items-center justify-between gap-3">
                <StatusPill status={e.status} />
                <span className="text-sm text-slate">{formatEventTime(e.startsAt)}</span>
              </div>
              <p className="mt-3 font-serif text-[1.9rem] leading-tight">{e.title}</p>
              <p className="mt-2 text-[0.95rem] text-slate">{nextStep(e)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
