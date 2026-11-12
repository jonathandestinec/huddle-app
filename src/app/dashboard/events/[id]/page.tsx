import { notFound } from "next/navigation";
import { ContentManager } from "@/functions/extra-content/ContentManager";
import { listContentForOwner } from "@/functions/extra-content/logic";
import { getEventOverview } from "@/lib/events/overview";
import { formatNaira } from "@/lib/money";
import { requireOrgOwner } from "@/lib/auth/session";
import { getEventById, listEventFunctions } from "@/lib/events/service";
import { utcToLagosLocal } from "@/lib/events/time";
import { getEnv } from "@/lib/env";
import { EventForm } from "../EventForm";
import { PublishBar } from "./PublishBar";
import { FunctionsPanel } from "./FunctionsPanel";

export default async function EventEditorPage({ params }: PageProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  const ev = await getEventById(id);
  if (!ev) notFound();
  await requireOrgOwner(ev.organisationId);
  const functions = await listEventFunctions(ev.id);
  const publicUrl = `${getEnv().APP_URL}/${ev.org.slug}/${ev.slug}`;
  const overview = await getEventOverview(ev.id);
  const contentFn = functions.find((f) => f.type === "extra_content");
  const extras: Record<string, React.ReactNode> = {};
  if (contentFn) {
    const items = await listContentForOwner(contentFn.id);
    extras[contentFn.id] = <ContentManager functionId={contentFn.id} items={items.map(({ id, title, kind }) => ({ id, title, kind }))} />;
  }

  return (
    <div className="space-y-10">
      <PublishBar eventId={ev.id} status={ev.status} publicUrl={publicUrl} title={ev.title} />
      <div className="grid grid-cols-3 gap-3">
        {[
          ["People in", String(overview.registrations)],
          ["Numbers taken", String(overview.numbersTaken)],
          ["You've earned", formatNaira(overview.revenueKobo)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">{label}</p>
            <p className="mt-1 font-serif text-3xl tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate">Details</h2>
          <EventForm
            eventId={ev.id}
            initial={{
              title: ev.title,
              description: ev.description ?? "",
              startsAtLocal: utcToLagosLocal(ev.startsAt),
              endsAtLocal: ev.endsAt ? utcToLagosLocal(ev.endsAt) : "",
              venue: ev.venue ?? "",
              meetingUrl: ev.meetingUrl ?? "",
              coverKey: ev.coverKey ?? undefined,
            }}
          />
        </section>
        <FunctionsPanel event={ev} functions={functions} hasBank={!!ev.org.paystackSubaccountCode} extras={extras} />
      </div>
    </div>
  );
}
