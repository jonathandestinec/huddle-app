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
    <main className={`mx-auto w-full max-w-xl flex-1 px-4 ${event.meetingUrl && event.status !== "ended" ? "pb-32" : "pb-16"}`}>
      <div className="relative -mx-4 aspect-[16/9] overflow-hidden bg-huddle-yellow sm:mx-0 sm:mt-4 sm:rounded-3xl">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center font-serif text-5xl italic">{org.name}</div>
        )}
      </div>
      <div className="mt-5 flex items-center gap-2 text-[0.95rem] text-slate">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo} alt="" className="h-8 w-8 rounded-full object-cover" />}
        <span className="font-semibold text-ink">{org.name}</span>
        {event.status === "draft" && <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-paper">Draft — only you can see this</span>}
        {event.status === "ended" && <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-bold">Ended</span>}
        <SoundToggle className="ml-auto" />
      </div>
      <h1 className="mt-3 font-serif text-[2.9rem] leading-[1.02]">{event.title}</h1>
      <dl className="mt-4 space-y-2 text-[1.05rem]">
        <div className="flex gap-3">
          <dt aria-label="When">🗓️</dt>
          <dd className="font-semibold">{formatEventTime(event.startsAt)}</dd>
        </div>
        {event.venue && (
          <div className="flex gap-3">
            <dt aria-label="Where">📍</dt>
            <dd>{event.venue}</dd>
          </div>
        )}
      </dl>
      {event.description && <p className="mt-5 whitespace-pre-line text-[1.05rem] leading-relaxed">{event.description}</p>}
      {event.meetingUrl && event.status !== "ended" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/8 bg-paper/95 p-3 backdrop-blur sm:static sm:mt-5 sm:border-0 sm:bg-transparent sm:p-0">
          <a
            href={event.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto flex min-h-14 max-w-xl items-center justify-center gap-2 rounded-[14px] bg-ink px-6 font-bold text-paper sm:inline-flex sm:max-w-none"
          >
            Join the meeting online ↗
          </a>
        </div>
      )}
      <FunctionCards
        functions={functions}
        event={event}
        orgSlug={org.slug}
        viewer={session?.user ?? null}
      />
    </main>
  );
}
