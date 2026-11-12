import { and, countDistinct, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

export async function getEventOverview(eventId: string): Promise<{ registrations: number; numbersTaken: number; revenueKobo: number }> {
  const [[reg], [nums], [rev]] = await Promise.all([
    db
      .select({ n: countDistinct(s.entitlements.userId) })
      .from(s.entitlements)
      .innerJoin(s.eventFunctions, eq(s.eventFunctions.id, s.entitlements.eventFunctionId))
      .where(eq(s.eventFunctions.eventId, eventId)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.numberClaims)
      .innerJoin(s.eventFunctions, eq(s.eventFunctions.id, s.numberClaims.eventFunctionId))
      .where(and(eq(s.eventFunctions.eventId, eventId), eq(s.numberClaims.status, "confirmed"))),
    db
      .select({ k: sql<number>`coalesce(sum(${s.payments.amountKobo} - ${s.payments.huddleFeeKobo}), 0)::int` })
      .from(s.payments)
      .innerJoin(s.eventFunctions, eq(s.eventFunctions.id, s.payments.eventFunctionId))
      .where(and(eq(s.eventFunctions.eventId, eventId), eq(s.payments.status, "success"))),
  ]);
  return { registrations: reg?.n ?? 0, numbersTaken: nums?.n ?? 0, revenueKobo: rev?.k ?? 0 };
}
