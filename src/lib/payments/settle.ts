import { eq, sql } from "drizzle-orm";
import { getFunctionWithEvent } from "@/lib/functions/service";
import { notifyOwners } from "@/lib/orgs/notify";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { sendAccessEmail } from "@/lib/email/access";
import { grantEntitlement } from "@/lib/gating/access";
import { verifyTransaction } from "@/lib/paystack/client";

export type SettleResult = "settled" | "already_settled" | "not_successful";

/**
 * Grants paid access. Always re-checks the transaction with Paystack (webhook or return page),
 * then settles under a row lock so concurrent/duplicate calls grant access exactly once.
 */
export async function settlePayment(reference: string, source: "webhook" | "verify"): Promise<SettleResult> {
  const [existing] = await db.select().from(s.payments).where(eq(s.payments.paystackReference, reference)).limit(1);
  if (!existing) return "not_successful";
  if (existing.status === "success") return "already_settled";

  const v = await verifyTransaction(reference);
  if (v.status !== "success") {
    if (v.status === "failed" || v.status === "abandoned") {
      const status = v.status === "failed" ? ("failed" as const) : ("abandoned" as const);
      await db
        .update(s.payments)
        .set({ status })
        .where(eq(s.payments.paystackReference, reference));
    }
    return "not_successful";
  }
  if (v.amountKobo !== existing.amountKobo) {
    console.error(`[settle:${source}] amount mismatch for ${reference}: paystack=${v.amountKobo} ours=${existing.amountKobo}`);
    return "not_successful";
  }

  const result = await db.transaction(async (tx) => {
    const [p] = await tx.select().from(s.payments).where(eq(s.payments.id, existing.id)).for("update");
    if (p.status === "success") return "already_settled" as const;
    const [updated] = await tx
      .update(s.payments)
      .set({ status: "success", settledAt: new Date() })
      .where(eq(s.payments.id, p.id))
      .returning();
    const { created } = await grantEntitlement(tx, {
      userId: updated.userId,
      functionId: updated.eventFunctionId,
      source: "payment",
      payment: updated,
    });
    if (!created) {
      // They already had access — this charge bought nothing. Flag it for a refund.
      await tx
        .update(s.payments)
        .set({ metadata: sql`${s.payments.metadata} || '{"duplicate": true}'::jsonb` })
        .where(eq(s.payments.id, p.id));
      return "duplicate" as const;
    }
    return "settled" as const;
  });
  if (result === "duplicate") {
    const info = await getFunctionWithEvent(existing.eventFunctionId);
    if (info) {
      notifyOwners(
        info.org.id,
        `Duplicate payment on "${info.event.title}" — refund needed`,
        `Payment ${reference} (${existing.amountKobo / 100} NGN) came from someone who already had access. Please refund it from your Paystack dashboard.`,
      );
    }
    return "settled";
  }
  if (result === "settled") sendAccessEmail(existing.userId, existing.eventFunctionId, "receipt", existing.amountKobo);
  return result;
}
