import { describe, expect, it } from "vitest";
import { friendlyBankError } from "@/lib/orgs/bank-errors";
import { PaystackError } from "@/lib/paystack/client";

describe("friendlyBankError", () => {
  it("explains Paystack's test-mode daily limit instead of blaming the account", () => {
    const msg = friendlyBankError(new PaystackError("Test mode daily limit of 3 live bank resolves exceeded. Use test bank codes 001 or upgrade to live mode.", 429));
    expect(msg).toMatch(/test mode/i);
    expect(msg).not.toMatch(/couldn't find/i);
  });

  it("keeps the not-found message for a genuinely unknown account", () => {
    expect(friendlyBankError(new PaystackError("Could not resolve account name. Check parameters or try again.", 422))).toBe(
      "We couldn't find that account. Check the number and bank.",
    );
  });

  it("surfaces auth problems as a configuration issue", () => {
    expect(friendlyBankError(new PaystackError("Invalid key", 401))).toMatch(/Paystack keys/i);
  });
});
