import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { UserError } from "@/lib/errors";
import { createSubaccount, resolveAccount } from "@/lib/paystack/client";

const input = z.object({
  bankCode: z.string().min(1),
  bankName: z.string().min(1),
  accountNumber: z.string().regex(/^\d{10}$/, "Account numbers are 10 digits"),
});

export async function linkBankAccount(organisationId: string, raw: z.input<typeof input>): Promise<void> {
  const { bankCode, bankName, accountNumber } = input.parse(raw);
  const [org] = await db.select().from(s.organisations).where(eq(s.organisations.id, organisationId)).limit(1);
  if (!org) throw new UserError("Organisation not found");

  await resolveAccount(accountNumber, bankCode); // throws if the account doesn't exist
  const { subaccountCode } = await createSubaccount({
    businessName: org.name,
    bankCode,
    accountNumber,
    percentageCharge: org.feeBps / 100,
  });

  await db
    .update(s.organisations)
    .set({ paystackSubaccountCode: subaccountCode, bankName, accountLast4: accountNumber.slice(-4) })
    .where(eq(s.organisations.id, organisationId));
}
