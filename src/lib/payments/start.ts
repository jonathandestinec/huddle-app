import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { UserError } from "@/lib/errors";
import { assertEventOpen, getFunctionWithEvent } from "@/lib/functions/service";
import { hasEntitlement } from "@/lib/gating/access";
import { initializeTransaction } from "@/lib/paystack/client";
import { huddleFeeKobo } from "@/lib/paystack/fees";

export function newReference(): string {
  return `hud_${randomBytes(12).toString("hex")}`;
}

export async function startPaidUnlock(
  userId: string,
  functionId: string,
  metadata: Record<string, unknown>,
): Promise<{ authorizationUrl: string; reference: string }> {
  const r = await getFunctionWithEvent(functionId);
  if (!r) throw new UserError("Function not found");
  const { fn, event, org } = r;
  assertEventOpen(event);
  if (fn.gate !== "paid" || !fn.priceKobo) throw new UserError("This one isn't paid");
  if (!org.paystackSubaccountCode) throw new UserError("This organisation can't take payments yet");
  if (await hasEntitlement(userId, functionId)) throw new UserError("You already have this");

  const [u] = await db.select({ email: s.user.email }).from(s.user).where(eq(s.user.id, userId));
  if (!u) throw new UserError("Sign in first");

  const reference = newReference();
  const fee = huddleFeeKobo(fn.priceKobo, org.feeBps);
  await db.insert(s.payments).values({
    userId,
    eventFunctionId: functionId,
    paystackReference: reference,
    amountKobo: fn.priceKobo,
    huddleFeeKobo: fee,
    metadata,
  });

  const returnUrl = `${getEnv().APP_URL}/${org.slug}/${event.slug}/paid?ref=${reference}`;
  const { authorizationUrl } = await initializeTransaction({
    email: u.email,
    amountKobo: fn.priceKobo,
    reference,
    callbackUrl: returnUrl,
    subaccount: org.paystackSubaccountCode,
    transactionChargeKobo: fee,
    // cancel_action: where Paystack's "Cancel payment" sends them. The return page releases the hold.
    metadata: { ...metadata, functionId, huddle: true, cancel_action: `${returnUrl}&cancelled=1` },
  });
  // Kept so a re-pick can reuse this checkout instead of opening a second charge.
  await db
    .update(s.payments)
    .set({ metadata: { ...metadata, authorizationUrl } })
    .where(eq(s.payments.paystackReference, reference));
  return { authorizationUrl, reference };
}
