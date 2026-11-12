import { and, count, eq } from "drizzle-orm";
import { db, type Tx } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { sendAccessEmail } from "@/lib/email/access";
import { getFunctionWithEvent } from "@/lib/functions/service";
import { grantEntitlement, hasEntitlement } from "@/lib/gating/access";
import { notifyOwners } from "@/lib/orgs/notify";
import type { EntitledContext } from "../types";
import { rsvpConfigSchema } from "./config";

class FullError extends Error {}

/** Reserve inside an open transaction. Locks the function row so capacity checks are serial. */
async function seatInTx(tx: Tx, userId: string, functionId: string): Promise<"reserved" | "already" | "full"> {
  // NO KEY UPDATE: serialises us without conflicting with FK KEY SHARE locks (avoids deadlocks).
  const [fn] = await tx.select().from(s.eventFunctions).where(eq(s.eventFunctions.id, functionId)).for("no key update");
  const [mine] = await tx
    .select({ id: s.rsvps.id })
    .from(s.rsvps)
    .where(and(eq(s.rsvps.eventFunctionId, functionId), eq(s.rsvps.userId, userId)));
  if (mine) return "already";
  const { capacity } = rsvpConfigSchema.parse(fn.config);
  if (capacity != null) {
    const [{ n }] = await tx.select({ n: count() }).from(s.rsvps).where(eq(s.rsvps.eventFunctionId, functionId));
    if (n >= capacity) return "full";
  }
  await tx.insert(s.rsvps).values({ eventFunctionId: functionId, userId });
  return "reserved";
}

export async function rsvpOnEntitled(ctx: EntitledContext): Promise<void> {
  const r = await seatInTx(ctx.tx, ctx.userId, ctx.functionId);
  if (r !== "full") return;
  if (ctx.source === "free") throw new FullError();
  if (ctx.payment) {
    const info = await getFunctionWithEvent(ctx.functionId);
    if (info) {
      notifyOwners(
        info.org.id,
        `Someone paid after "${info.event.title}" filled up`,
        `A payment came in for RSVP & Seats on "${info.event.title}" after it reached capacity. They have access, but no seat was reserved — you may want to add a seat or contact them.`,
      );
    }
  }
}

export type ReserveResult = { ok: true } | { ok: false; error: "This one's full" | "Unlock this first" | "This event has ended" };

export async function reserveSeat(userId: string, functionId: string): Promise<ReserveResult> {
  const info = await getFunctionWithEvent(functionId);
  if (!info || info.fn.type !== "rsvp") throw new Error("Not an RSVP function");
  if (info.event.status === "ended") return { ok: false, error: "This event has ended" };

  const entitled = await hasEntitlement(userId, functionId);
  if (!entitled && info.fn.gate !== "free") return { ok: false, error: "Unlock this first" };

  try {
    const r = await db.transaction(async (tx) => {
      if (!entitled) {
        const { created } = await grantEntitlement(tx, { userId, functionId, source: "free" });
        if (created) return "granted" as const; // onEntitled reserved the seat (or threw FullError)
      }
      return seatInTx(tx, userId, functionId);
    });
    if (r === "granted") sendAccessEmail(userId, functionId, "registered");
    return r === "full" ? { ok: false, error: "This one's full" } : { ok: true };
  } catch (err) {
    if (err instanceof FullError) return { ok: false, error: "This one's full" };
    throw err;
  }
}

export async function seatsLeft(functionId: string): Promise<number | null> {
  const [fn] = await db.select().from(s.eventFunctions).where(eq(s.eventFunctions.id, functionId));
  const { capacity } = rsvpConfigSchema.parse(fn.config);
  if (capacity == null) return null;
  const [{ n }] = await db.select({ n: count() }).from(s.rsvps).where(eq(s.rsvps.eventFunctionId, functionId));
  return Math.max(0, capacity - n);
}

export async function hasSeat(userId: string, functionId: string): Promise<boolean> {
  const [r] = await db
    .select({ id: s.rsvps.id })
    .from(s.rsvps)
    .where(and(eq(s.rsvps.eventFunctionId, functionId), eq(s.rsvps.userId, userId)));
  return !!r;
}
