import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getFunctionDefinition } from "@/functions/registry";
import type { FunctionType } from "@/functions/types";

export function meAccess(user: { emailVerified: boolean } | null): "show" | "verify" {
  return user?.emailVerified ? "show" : "verify";
}

export type MyHuddle = {
  event: typeof s.events.$inferSelect;
  org: typeof s.organisations.$inferSelect;
  items: { functionId: string; functionType: FunctionType; label: string; detail: string }[];
};

export async function getMyHuddles(userId: string): Promise<MyHuddle[]> {
  const rows = await db
    .select({ fn: s.eventFunctions, event: s.events, org: s.organisations })
    .from(s.entitlements)
    .innerJoin(s.eventFunctions, eq(s.eventFunctions.id, s.entitlements.eventFunctionId))
    .innerJoin(s.events, eq(s.events.id, s.eventFunctions.eventId))
    .innerJoin(s.organisations, eq(s.organisations.id, s.events.organisationId))
    .where(eq(s.entitlements.userId, userId));
  if (!rows.length) return [];

  const fnIds = rows.map((r) => r.fn.id);
  const [claims, seats, content] = await Promise.all([
    db
      .select({ fid: s.numberClaims.eventFunctionId, number: s.numberClaims.number })
      .from(s.numberClaims)
      .where(and(eq(s.numberClaims.userId, userId), eq(s.numberClaims.status, "confirmed"), inArray(s.numberClaims.eventFunctionId, fnIds))),
    db
      .select({ fid: s.rsvps.eventFunctionId })
      .from(s.rsvps)
      .where(and(eq(s.rsvps.userId, userId), inArray(s.rsvps.eventFunctionId, fnIds))),
    db.select({ fid: s.contentItems.eventFunctionId }).from(s.contentItems).where(inArray(s.contentItems.eventFunctionId, fnIds)),
  ]);
  const numberBy = new Map(claims.map((c) => [c.fid, c.number]));
  const seatSet = new Set(seats.map((x) => x.fid));
  const contentCount = new Map<string, number>();
  for (const c of content) contentCount.set(c.fid, (contentCount.get(c.fid) ?? 0) + 1);

  const detail = (fid: string, type: FunctionType) => {
    if (type === "number_picker") return numberBy.has(fid) ? `#${numberBy.get(fid)}` : "Pick your number";
    if (type === "rsvp") return seatSet.has(fid) ? "Seat reserved" : "Access granted";
    const n = contentCount.get(fid) ?? 0;
    return `${n} item${n === 1 ? "" : "s"}`;
  };

  const byEvent = new Map<string, MyHuddle>();
  for (const r of rows) {
    const h = byEvent.get(r.event.id) ?? { event: r.event, org: r.org, items: [] };
    h.items.push({ functionId: r.fn.id, functionType: r.fn.type, label: getFunctionDefinition(r.fn.type).label, detail: detail(r.fn.id, r.fn.type) });
    byEvent.set(r.event.id, h);
  }
  const now = Date.now();
  const all = [...byEvent.values()];
  const upcoming = all.filter((h) => h.event.startsAt.getTime() >= now).sort((a, b) => a.event.startsAt.getTime() - b.event.startsAt.getTime());
  const past = all.filter((h) => h.event.startsAt.getTime() < now).sort((a, b) => b.event.startsAt.getTime() - a.event.startsAt.getTime());
  return [...upcoming, ...past];
}
