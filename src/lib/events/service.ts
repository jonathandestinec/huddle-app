import { and, asc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { UserError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import { lagosLocalToUtc } from "./time";

export type Event = typeof s.events.$inferSelect;
export type EventFunction = typeof s.eventFunctions.$inferSelect;
export type Org = typeof s.organisations.$inferSelect;

const httpUrl = z
  .string()
  .trim()
  .regex(/^https?:\/\//, "Links must start with http:// or https://")
  .max(500);

const eventInput = z.object({
  title: z.string().trim().min(2, "Give your event a title").max(120),
  slug: z.string().optional(),
  description: z.string().trim().max(5000).optional(),
  coverKey: z.string().optional(),
  startsAtLocal: z.string(),
  endsAtLocal: z.string().optional(),
  venue: z.string().trim().max(200).optional(),
  meetingUrl: httpUrl.optional().or(z.literal("")),
});

export type EventInput = z.input<typeof eventInput>;

function toRow(input: z.output<typeof eventInput>, organisationId: string) {
  if (input.coverKey && !input.coverKey.startsWith(`covers/${organisationId}/`)) throw new UserError("Upload the cover image again");
  const startsAt = lagosLocalToUtc(input.startsAtLocal);
  const endsAt = input.endsAtLocal ? lagosLocalToUtc(input.endsAtLocal) : null;
  if (endsAt && endsAt <= startsAt) throw new UserError("The event can't end before it starts");
  return {
    title: input.title,
    description: input.description || null,
    coverKey: input.coverKey || null,
    startsAt,
    endsAt,
    venue: input.venue || null,
    meetingUrl: input.meetingUrl || null,
  };
}

async function uniqueSlug(organisationId: string, wanted: string): Promise<string> {
  const base = slugify(wanted) || "event";
  const taken = new Set(
    (
      await db
        .select({ slug: s.events.slug })
        .from(s.events)
        .where(and(eq(s.events.organisationId, organisationId), or(eq(s.events.slug, base), like(s.events.slug, `${base}-%`))))
    ).map((r) => r.slug),
  );
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

export async function createEvent(organisationId: string, raw: EventInput): Promise<{ id: string; slug: string }> {
  const input = eventInput.parse(raw);
  const row = toRow(input, organisationId);
  const slug = await uniqueSlug(organisationId, input.slug || input.title);
  const [ev] = await db
    .insert(s.events)
    .values({ ...row, organisationId, slug, status: "draft" })
    .returning({ id: s.events.id, slug: s.events.slug });
  return ev;
}

export async function updateEvent(eventId: string, raw: EventInput): Promise<void> {
  const [ev] = await db.select({ org: s.events.organisationId }).from(s.events).where(eq(s.events.id, eventId));
  if (!ev) throw new UserError("Event not found");
  const row = toRow(eventInput.parse(raw), ev.org);
  await db.update(s.events).set(row).where(eq(s.events.id, eventId));
}

export async function publishEvent(eventId: string): Promise<void> {
  await db.update(s.events).set({ status: "published" }).where(eq(s.events.id, eventId));
}

export async function endEvent(eventId: string): Promise<void> {
  await db.update(s.events).set({ status: "ended" }).where(eq(s.events.id, eventId));
}

export async function getEventById(eventId: string): Promise<(Event & { org: Org }) | null> {
  const [r] = await db
    .select({ event: s.events, org: s.organisations })
    .from(s.events)
    .innerJoin(s.organisations, eq(s.organisations.id, s.events.organisationId))
    .where(eq(s.events.id, eventId))
    .limit(1);
  return r ? { ...r.event, org: r.org } : null;
}

export async function listOrgEvents(organisationId: string): Promise<Event[]> {
  return db.select().from(s.events).where(eq(s.events.organisationId, organisationId)).orderBy(asc(s.events.startsAt));
}

/** Events with how many functions each has — enough to suggest the organiser's next step. */
export async function listOrgEventsWithCounts(organisationId: string): Promise<(Event & { functionCount: number })[]> {
  const evs = await listOrgEvents(organisationId);
  if (!evs.length) return [];
  const fns = await db
    .select({ eventId: s.eventFunctions.eventId })
    .from(s.eventFunctions)
    .innerJoin(s.events, eq(s.events.id, s.eventFunctions.eventId))
    .where(eq(s.events.organisationId, organisationId));
  const counts = new Map<string, number>();
  for (const f of fns) counts.set(f.eventId, (counts.get(f.eventId) ?? 0) + 1);
  return evs.map((e) => ({ ...e, functionCount: counts.get(e.id) ?? 0 }));
}

export async function listEventFunctions(eventId: string): Promise<EventFunction[]> {
  return db.select().from(s.eventFunctions).where(eq(s.eventFunctions.eventId, eventId)).orderBy(asc(s.eventFunctions.position));
}

export async function getPublicEvent(
  orgSlug: string,
  eventSlug: string,
  viewerId: string | null,
  opts: { includeDrafts?: boolean } = {},
): Promise<{ org: Org; event: Event; functions: EventFunction[] } | null> {
  const [r] = await db
    .select({ event: s.events, org: s.organisations })
    .from(s.events)
    .innerJoin(s.organisations, eq(s.organisations.id, s.events.organisationId))
    .where(and(eq(s.organisations.slug, orgSlug), eq(s.events.slug, eventSlug)))
    .limit(1);
  if (!r) return null;

  if (r.event.status === "draft" && !opts.includeDrafts) {
    if (!viewerId) return null;
    const [m] = await db
      .select({ role: s.memberships.role })
      .from(s.memberships)
      .where(and(eq(s.memberships.userId, viewerId), eq(s.memberships.organisationId, r.org.id)))
      .limit(1);
    if (!m) return null;
  }

  return { org: r.org, event: r.event, functions: await listEventFunctions(r.event.id) };
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Copies an event as a fresh draft: details, cover, links, every function with its settings,
 * price and access code, and Extra Content items. Nobody's RSVPs, numbers or payments come along.
 * A date that has passed moves forward by whole weeks, so a weekly service lands on its next week.
 */
export async function duplicateEvent(eventId: string, now = new Date()): Promise<{ id: string; slug: string }> {
  const [src] = await db.select().from(s.events).where(eq(s.events.id, eventId));
  if (!src) throw new UserError("Event not found");
  const weeks = src.startsAt <= now ? Math.floor((now.getTime() - src.startsAt.getTime()) / WEEK_MS) + 1 : 0;
  const shift = (d: Date) => new Date(d.getTime() + weeks * WEEK_MS);
  const slug = await uniqueSlug(src.organisationId, src.slug);

  return db.transaction(async (tx) => {
    const [ev] = await tx
      .insert(s.events)
      .values({
        organisationId: src.organisationId,
        slug,
        title: src.title,
        description: src.description,
        coverKey: src.coverKey,
        startsAt: shift(src.startsAt),
        endsAt: src.endsAt ? shift(src.endsAt) : null,
        venue: src.venue,
        meetingUrl: src.meetingUrl,
        status: "draft",
      })
      .returning({ id: s.events.id, slug: s.events.slug });

    const fns = await tx.select().from(s.eventFunctions).where(eq(s.eventFunctions.eventId, src.id)).orderBy(asc(s.eventFunctions.position));
    for (const f of fns) {
      const [copy] = await tx
        .insert(s.eventFunctions)
        .values({ eventId: ev.id, type: f.type, gate: f.gate, priceKobo: f.priceKobo, accessCodeHash: f.accessCodeHash, config: f.config, position: f.position })
        .returning({ id: s.eventFunctions.id });
      const items = await tx.select().from(s.contentItems).where(eq(s.contentItems.eventFunctionId, f.id));
      if (items.length) {
        await tx.insert(s.contentItems).values(items.map(({ id: _, eventFunctionId: __, ...rest }) => ({ ...rest, eventFunctionId: copy.id })));
      }
    }
    return ev;
  });
}
