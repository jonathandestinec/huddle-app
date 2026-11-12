import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SoundToggle } from "@/components/SoundToggle";
import { getSession } from "@/lib/auth/session";
import { getPublicEvent } from "@/lib/events/service";
import { formatEventTime } from "@/lib/events/time";
import { publicImageUrl } from "@/lib/storage";
import { FunctionCards } from "./FunctionCards";

export async function generateMetadata({ params }: PageProps<"/[org]/[event]">): Promise<Metadata> {
  const { org, event } = await params;
  const data = await getPublicEvent(org, event, null);
  return data ? { title: `${data.event.title} · ${data.org.name}`, description: data.event.description ?? undefined } : {};
}

export default async function PublicEventPage({ params }: PageProps<"/[org]/[event]">) {
  const { org: orgSlug, event: eventSlug } = await params;
  const session = await getSession();
  const data = await getPublicEvent(orgSlug, eventSlug, session?.user.id ?? null);
  if (!data) notFound();
  const { org, event, functions } = data;
  const [cover, logo] = await Promise.all([
    event.coverKey ? publicImageUrl(event.coverKey) : null,
    org.logoKey ? publicImageUrl(org.logoKey) : null,
  ]);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-20">
      <div className="relative -mx-4 aspect-[16/9] overflow-hidden bg-huddle-yellow sm:mx-0 sm:mt-4 sm:rounded-3xl">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-5xl italic">{org.name}</div>
        )}
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm text-slate">
        <SoundToggle className="order-last ml-auto" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo} alt="" className="h-6 w-6 rounded-full object-cover" />}
        {org.name}
        {event.status === "draft" && <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-paper">Draft</span>}
        {event.status === "ended" && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs">Ended</span>}
      </div>
      <h1 className="mt-2 font-serif text-5xl leading-[1.05]">{event.title}</h1>
      <p className="mt-3 font-semibold">{formatEventTime(event.startsAt)}</p>
      {event.venue && <p className="text-slate">📍 {event.venue}</p>}
      {event.meetingUrl && (
        <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold underline">
          Join online →
        </a>
      )}
      {event.description && <p className="mt-5 whitespace-pre-line leading-relaxed">{event.description}</p>}
      <FunctionCards
        functions={functions}
        event={event}
        orgSlug={org.slug}
        viewer={session?.user ?? null}
      />
    </main>
  );
}
