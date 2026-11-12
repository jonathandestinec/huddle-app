import Link from "next/link";
import { notFound } from "next/navigation";
import { getHostState } from "@/functions/number-picker/host";
import { requireOrgOwner } from "@/lib/auth/session";
import { getEventById, listEventFunctions } from "@/lib/events/service";
import { HostLive } from "./HostLive";

export default async function LivePage({ params }: PageProps<"/dashboard/events/[id]/live">) {
  const { id } = await params;
  const ev = await getEventById(id);
  if (!ev) notFound();
  const user = await requireOrgOwner(ev.organisationId);
  const picker = (await listEventFunctions(ev.id)).find((f) => f.type === "number_picker");

  if (!picker) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-serif text-4xl">Nothing to host yet</h1>
        <p className="mt-2 text-slate">Attach a Number Picker to this event to call numbers live.</p>
        <Link href={`/dashboard/events/${ev.id}`} className="mt-6 inline-block underline">
          Back to the event
        </Link>
      </div>
    );
  }
  return <HostLive functionId={picker.id} eventId={ev.id} title={ev.title} initial={await getHostState(user.id, picker.id)} />;
}
