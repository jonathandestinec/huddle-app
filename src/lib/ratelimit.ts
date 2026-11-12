import { and, count, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

export type RateRule = { key: string; limit: number };

/**
 * Atomically consumes one hit against every rule. Returns false (and records nothing)
 * if any rule is already at its limit within the window. Advisory locks make it exact
 * under concurrency; keys are locked in sorted order to avoid deadlocks.
 */
export async function consumeRateLimit(rules: RateRule[], windowMs: number): Promise<boolean> {
  const sorted = [...rules].sort((a, b) => a.key.localeCompare(b.key));
  return db.transaction(async (tx) => {
    for (const r of sorted) await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${r.key}))`);
    const since = new Date(Date.now() - windowMs);
    for (const r of sorted) {
      const [{ n }] = await tx
        .select({ n: count() })
        .from(s.rateEvents)
        .where(and(eq(s.rateEvents.key, r.key), gt(s.rateEvents.at, since)));
      if (n >= r.limit) return false;
    }
    await tx.insert(s.rateEvents).values(sorted.map((r) => ({ key: r.key })));
    return true;
  });
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
