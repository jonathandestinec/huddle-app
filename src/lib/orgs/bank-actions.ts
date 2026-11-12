"use server";
import { requireOrgOwner } from "@/lib/auth/session";
import { UserError, toActionResult } from "@/lib/errors";
import { PaystackError, resolveAccount } from "@/lib/paystack/client";
import { linkBankAccount } from "./bank";

export async function resolveAccountAction(organisationId: string, accountNumber: string, bankCode: string) {
  return toActionResult(async () => {
    await requireOrgOwner(organisationId);
    try {
      return await resolveAccount(accountNumber, bankCode);
    } catch (err) {
      if (err instanceof PaystackError) throw new UserError("We couldn't find that account. Check the number and bank.");
      throw err;
    }
  });
}

export async function linkBankAction(
  organisationId: string,
  input: { bankCode: string; bankName: string; accountNumber: string },
) {
  return toActionResult(async () => {
    await requireOrgOwner(organisationId);
    try {
      await linkBankAccount(organisationId, input);
    } catch (err) {
      if (err instanceof PaystackError) throw new UserError(`Paystack said: ${err.message}`);
      throw err;
    }
  });
}
