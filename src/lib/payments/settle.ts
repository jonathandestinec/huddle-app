import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
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

  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(s.payments).where(eq(s.payments.id, existing.id)).for("update");
    if (p.status === "success") return "already_settled" as const;
    const [updated] = await tx
      .update(s.payments)
      .set({ status: "success", settledAt: new Date() })
      .where(eq(s.payments.id, p.id))
      .returning();
    await grantEntitlement(tx, {
      userId: updated.userId,
      functionId: updated.eventFunctionId,
      source: "payment",
      payment: updated,
    });
    return "settled" as const;
  });
}
