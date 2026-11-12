"use server";
import { requireOrgOwner } from "@/lib/auth/session";
import { UserError, toActionResult } from "@/lib/errors";
import { PaystackError, resolveAccount } from "@/lib/paystack/client";
import { linkBankAccount } from "./bank";
import { friendlyBankError } from "./bank-errors";

export async function resolveAccountAction(organisationId: string, accountNumber: string, bankCode: string) {
  return toActionResult(async () => {
    await requireOrgOwner(organisationId);
    try {
      return await resolveAccount(accountNumber, bankCode);
    } catch (err) {
      if (err instanceof PaystackError) throw new UserError(friendlyBankError(err));
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
      if (err instanceof PaystackError) {
        throw new UserError(err.status === 400 ? `Paystack said: ${err.message}` : friendlyBankError(err));
      }
      throw err;
    }
  });
}
