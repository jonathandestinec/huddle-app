import Link from "next/link";
import { Penguin } from "@/components/Penguin";
import { listOrgEvents } from "@/lib/events/service";
import { formatEventTime } from "@/lib/events/time";
import { requireCurrentOrg } from "@/lib/orgs/current";

const statusLabel = { draft: "Draft", published: "Live", ended: "Ended" } as const;

export default async function EventsPage() {
  const { org } = await requireCurrentOrg();
  const events = await listOrgEvents(org.id);
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate">{org.name}</p>
          <h1 className="font-serif text-4xl">Your huddles</h1>
        </div>
        <Link href="/dashboard/events/new" className="rounded-full bg-huddle-yellow px-5 py-3 text-sm font-bold">
          New event
        </Link>
      </div>
      {!org.paystackSubaccountCode && (
        <Link href="/dashboard/onboarding/bank" className="mt-6 block rounded-2xl border border-dashed border-ink/20 p-4 text-sm">
          💸 <strong>Want to earn from your events?</strong> Link a bank account →
        </Link>
      )}
      {events.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Penguin mood="wave" size={120} />
          <p className="mt-4 font-serif text-2xl">No huddles yet. Let&apos;s start one.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                href={`/dashboard/events/${e.id}`}
                className="block rounded-3xl bg-surface p-5 transition-transform duration-150 hover:-translate-y-0.5"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate">{statusLabel[e.status]}</span>
                <p className="mt-1 font-serif text-2xl">{e.title}</p>
                <p className="text-sm text-slate">{formatEventTime(e.startsAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
