import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui";
import { ContentManager } from "@/functions/extra-content/ContentManager";
import { listContentForOwner } from "@/functions/extra-content/logic";
import { requireOrgOwner } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { getEventOverview } from "@/lib/events/overview";
import { getEventById, listEventFunctions } from "@/lib/events/service";
import { formatEventTime, utcToLagosLocal } from "@/lib/events/time";
import { EventForm } from "../EventForm";
import { EditorSteps, type StepId } from "./EditorSteps";
import { FunctionsPanel } from "./FunctionsPanel";
import { DuplicateEventButton } from "./DuplicateEventButton";
import { SharePanel } from "./SharePanel";

export default async function EventEditorPage({ params, searchParams }: PageProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  const { step, copied } = await searchParams;
  const ev = await getEventById(id);
  if (!ev) notFound();
  await requireOrgOwner(ev.organisationId);
  const [functions, overview] = await Promise.all([listEventFunctions(ev.id), getEventOverview(ev.id)]);
  const publicUrl = `${getEnv().APP_URL}/${ev.org.slug}/${ev.slug}`;

  const contentFn = functions.find((f) => f.type === "extra_content");
  const extras: Record<string, React.ReactNode> = {};
  if (contentFn) {
    const items = await listContentForOwner(contentFn.id);
    extras[contentFn.id] = <ContentManager functionId={contentFn.id} items={items.map(({ id, title, kind }) => ({ id, title, kind }))} />;
  }

  const initialStep: StepId =
    step === "details" || step === "functions" || step === "share" ? step : functions.length === 0 && ev.status === "draft" ? "details" : "share";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/events" className="inline-flex min-h-12 items-center gap-1 font-semibold text-slate">
          ← All events
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-[2.4rem] leading-none sm:text-5xl">{ev.title}</h1>
          <StatusPill status={ev.status} />
          <span className="ml-auto">
            <DuplicateEventButton eventId={ev.id} />
          </span>
        </div>
        <p className="mt-2 text-slate">{formatEventTime(ev.startsAt)}</p>
      </div>

      {copied && (
        <p role="status" className="rounded-2xl bg-huddle-yellow/30 px-4 py-3 font-medium">
          This is your copy. Check the date and details, then publish it when you&apos;re ready.
        </p>
      )}

      <EditorSteps
        initial={initialStep}
        counts={{ functions: functions.length }}
        details={
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
        }
        functions={<FunctionsPanel event={ev} functions={functions} hasBank={!!ev.org.paystackSubaccountCode} extras={extras} />}
        share={
          <SharePanel
            eventId={ev.id}
            status={ev.status}
            publicUrl={publicUrl}
            hasFunctions={functions.length > 0}
            hasPicker={functions.some((f) => f.type === "number_picker")}
            overview={overview}
          />
        }
      />
    </div>
  );
}
