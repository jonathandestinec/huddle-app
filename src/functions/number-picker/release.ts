import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { settlePayment } from "@/lib/payments/settle";
import { verifyTransaction } from "@/lib/paystack/client";

/**
 * - released: the hold is gone and the number is free for everyone again
 * - paid: Paystack says it went through after all, so the number is now confirmed
 * - processing: Paystack is still working on it (e.g. a bank transfer), so the hold stays
 * - none: there was no unpaid hold to release
 */
export type ReleaseResult = { status: "released" | "paid" | "processing"; number: number } | { status: "none" };

/**
 * Paystack statuses where money may genuinely still be on its way, so the hold stays.
 * Everything else that isn't "success" — abandoned, failed, reversed, and "ongoing" (they started,
 * e.g. opened the bank option, then closed checkout) — releases. If an "ongoing" one is somehow
 * finished later, settlement still gives them the number back if it's free, or access to pick another.
 */
const IN_FLIGHT = new Set(["pending", "processing", "queued"]);

async function release(claim: { id: string; number: number }, reference: string | null): Promise<ReleaseResult> {
  if (reference) {
    let status: string;
    try {
      status = (await verifyTransaction(reference)).status;
    } catch (err) {
      // Can't tell whether they paid: keep the hold. It still runs out on its own after 10 minutes.
      console.error("[releaseHold] verify failed", reference, err);
      return { status: "processing", number: claim.number };
    }
    if (status === "success") {
      await settlePayment(reference, "verify");
      return { status: "paid", number: claim.number };
    }
    if (IN_FLIGHT.has(status)) return { status: "processing", number: claim.number };
  }

  await db.transaction(async (tx) => {
    await tx.delete(s.numberClaims).where(and(eq(s.numberClaims.id, claim.id), eq(s.numberClaims.status, "held")));
    if (reference) {
      await tx
        .update(s.payments)
        .set({ status: "abandoned" })
        .where(and(eq(s.payments.paystackReference, reference), eq(s.payments.status, "pending")));
    }
  });
  return { status: "released", number: claim.number };
}

/** The attendee came back without paying (browser back, closed checkout): give their number back. */
export async function releaseMyHold(userId: string, functionId: string): Promise<ReleaseResult> {
  const [claim] = await db
    .select()
    .from(s.numberClaims)
    .where(
      and(eq(s.numberClaims.eventFunctionId, functionId), eq(s.numberClaims.userId, userId), eq(s.numberClaims.status, "held")),
    );
  if (!claim) return { status: "none" };
  const [pending] = await db
    .select({ reference: s.payments.paystackReference })
    .from(s.payments)
    .where(
      and(
        eq(s.payments.userId, userId),
        eq(s.payments.eventFunctionId, functionId),
        eq(s.payments.status, "pending"),
        sql`${s.payments.metadata}->>'claimId' = ${claim.id}`,
      ),
    )
    .limit(1);
  return release(claim, pending?.reference ?? null);
}

/** Paystack's "Cancel payment" sends people back with the reference: release that checkout's hold. */
export async function releaseHoldForReference(reference: string): Promise<ReleaseResult> {
  const [p] = await db.select().from(s.payments).where(eq(s.payments.paystackReference, reference)).limit(1);
  const claimId = (p?.metadata as { claimId?: unknown } | undefined)?.claimId;
  if (!p || p.status !== "pending" || typeof claimId !== "string") return { status: "none" };
  const [claim] = await db
    .select()
    .from(s.numberClaims)
    .where(and(eq(s.numberClaims.id, claimId), eq(s.numberClaims.status, "held")));
  if (!claim) return { status: "none" };
  return release(claim, reference);
}
