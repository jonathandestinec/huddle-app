import { and, eq, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { isUniqueViolation, uniqueConstraintName } from "@/lib/errors";
import { getFunctionWithEvent } from "@/lib/functions/service";
import { grantEntitlement, hasEntitlement } from "@/lib/gating/access";
import { startPaidUnlock } from "@/lib/payments/start";
import type { EntitledContext } from "../types";
import { numberPickerConfigSchema } from "./config";

export const HOLD_MS = 10 * 60 * 1000;

export type ClaimError =
  | `Someone just grabbed #${number}. Try another?`
  | `You already hold #${number}`
  | "That number isn't in range"
  | "This event has ended"
  | "Unlock this first";

export type ClaimResult =
  | { ok: true; status: "confirmed" }
  | { ok: true; status: "held"; authorizationUrl: string }
  | { ok: false; error: ClaimError };

async function myClaim(userId: string, functionId: string) {
  const [c] = await db
    .select()
    .from(s.numberClaims)
    .where(and(eq(s.numberClaims.eventFunctionId, functionId), eq(s.numberClaims.userId, userId)));
  return c;
}

async function mapUnique(err: unknown, userId: string, functionId: string, n: number): Promise<ClaimResult> {
  if (uniqueConstraintName(err) === "number_claims_function_user") {
    const c = await myClaim(userId, functionId);
    return { ok: false, error: `You already hold #${c?.number ?? n}` };
  }
  return { ok: false, error: `Someone just grabbed #${n}. Try another?` };
}

export async function claimNumber(userId: string, functionId: string, n: number): Promise<ClaimResult> {
  const info = await getFunctionWithEvent(functionId);
  if (!info || info.fn.type !== "number_picker") throw new Error("Not a number picker");
  if (info.event.status === "ended") return { ok: false, error: "This event has ended" };
  const { min, max } = numberPickerConfigSchema.parse(info.fn.config);
  if (!Number.isInteger(n) || n < min || n > max) return { ok: false, error: "That number isn't in range" };

  // Expired holds on this number (or this person's own) don't block anyone.
  await db
    .delete(s.numberClaims)
    .where(
      and(
        eq(s.numberClaims.eventFunctionId, functionId),
        eq(s.numberClaims.status, "held"),
        lt(s.numberClaims.holdExpiresAt, new Date()),
        or(eq(s.numberClaims.number, n), eq(s.numberClaims.userId, userId)),
      ),
    );

  const mine = await myClaim(userId, functionId);
  if (mine?.status === "confirmed") return { ok: false, error: `You already hold #${mine.number}` };
  if (mine?.status === "held") await db.delete(s.numberClaims).where(eq(s.numberClaims.id, mine.id)); // re-pick

  const entitled = await hasEntitlement(userId, functionId);
  const gate = info.fn.gate;

  try {
    if (entitled) {
      await db.insert(s.numberClaims).values({ eventFunctionId: functionId, number: n, userId, status: "confirmed" });
      return { ok: true, status: "confirmed" };
    }
    if (gate === "code") return { ok: false, error: "Unlock this first" };
    if (gate === "free") {
      await db.transaction(async (tx) => {
        await grantEntitlement(tx, { userId, functionId, source: "free" });
        await tx.insert(s.numberClaims).values({ eventFunctionId: functionId, number: n, userId, status: "confirmed" });
      });
      return { ok: true, status: "confirmed" };
    }
    // paid
    const [hold] = await db
      .insert(s.numberClaims)
      .values({ eventFunctionId: functionId, number: n, userId, status: "held", holdExpiresAt: new Date(Date.now() + HOLD_MS) })
      .returning({ id: s.numberClaims.id });
    try {
      const { authorizationUrl } = await startPaidUnlock(userId, functionId, { claimId: hold.id, number: n });
      return { ok: true, status: "held", authorizationUrl };
    } catch (err) {
      await db.delete(s.numberClaims).where(eq(s.numberClaims.id, hold.id));
      throw err;
    }
  } catch (err) {
    if (isUniqueViolation(err)) return mapUnique(err, userId, functionId, n);
    throw err;
  }
}

/** On paid settlement: confirm the held number, or re-take it if the hold expired and it's still free. */
export async function numberPickerOnEntitled(ctx: EntitledContext): Promise<void> {
  if (!ctx.payment) return;
  const meta = ctx.payment.metadata as { claimId?: string; number?: number };
  if (meta.claimId) {
    const updated = await ctx.tx
      .update(s.numberClaims)
      .set({ status: "confirmed", holdExpiresAt: null })
      .where(and(eq(s.numberClaims.id, meta.claimId), eq(s.numberClaims.userId, ctx.userId)))
      .returning({ id: s.numberClaims.id });
    if (updated.length) return;
  }
  if (typeof meta.number === "number") {
    await ctx.tx
      .insert(s.numberClaims)
      .values({ eventFunctionId: ctx.functionId, number: meta.number, userId: ctx.userId, status: "confirmed" })
      .onConflictDoNothing();
  }
}

export type PickerState = {
  min: number;
  max: number;
  taken: number[];
  mine: { number: number; status: "held" | "confirmed" } | null;
  called: number | null;
};

export async function getPickerState(functionId: string, viewerId: string | null): Promise<PickerState> {
  const [fn] = await db.select().from(s.eventFunctions).where(eq(s.eventFunctions.id, functionId));
  const { min, max } = numberPickerConfigSchema.parse(fn.config);
  const now = Date.now();
  const rows = (await db.select().from(s.numberClaims).where(eq(s.numberClaims.eventFunctionId, functionId))).filter(
    (c) => c.status === "confirmed" || (c.holdExpiresAt && c.holdExpiresAt.getTime() > now),
  );
  const mineRow = viewerId ? rows.find((c) => c.userId === viewerId) : undefined;
  const calledRow = rows.filter((c) => c.calledAt).sort((a, b) => b.calledAt!.getTime() - a.calledAt!.getTime())[0];
  return {
    min,
    max,
    taken: rows.map((c) => c.number).sort((a, b) => a - b),
    mine: mineRow ? { number: mineRow.number, status: mineRow.status } : null,
    called: calledRow?.number ?? null,
  };
}

export async function sweepExpiredHolds(now = new Date()): Promise<number> {
  const released = await db
    .delete(s.numberClaims)
    .where(and(eq(s.numberClaims.status, "held"), lt(s.numberClaims.holdExpiresAt, now)))
    .returning({ id: s.numberClaims.id });
  if (released.length) {
    await db
      .update(s.payments)
      .set({ status: "abandoned" })
      .where(
        and(
          eq(s.payments.status, "pending"),
          inArray(
            sql`${s.payments.metadata}->>'claimId'`,
            released.map((r) => r.id),
          ),
        ),
      );
  }
  return released.length;
}
