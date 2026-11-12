import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/paystack/client", async (orig) => ({
  ...(await orig<typeof import("@/lib/paystack/client")>()),
  resolveAccount: vi.fn(async () => ({ accountName: "ADA OBI" })),
  createSubaccount: vi.fn(async () => ({ subaccountCode: "ACCT_test123" })),
}));

import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { linkBankAccount } from "@/lib/orgs/bank";
import { createSubaccount } from "@/lib/paystack/client";
import { makeOrg, resetDb } from "./setup";

describe("linkBankAccount", () => {
  beforeEach(resetDb);

  it("creates a subaccount at the org's fee and stores only the last 4 digits", async () => {
    const org = await makeOrg({ name: "Watchers Channel" });
    await linkBankAccount(org.id, { bankCode: "058", accountNumber: "0123456789", bankName: "GTBank" });
    expect(createSubaccount).toHaveBeenCalledWith({
      businessName: "Watchers Channel",
      bankCode: "058",
      accountNumber: "0123456789",
      percentageCharge: 5,
    });
    const [row] = await db.select().from(s.organisations).where(eq(s.organisations.id, org.id));
    expect(row.paystackSubaccountCode).toBe("ACCT_test123");
    expect(row.accountLast4).toBe("6789");
    expect(row.bankName).toBe("GTBank");
    expect(JSON.stringify(row)).not.toContain("0123456789");
  });

  it("rejects an account number that isn't 10 digits", async () => {
    const org = await makeOrg();
    await expect(linkBankAccount(org.id, { bankCode: "058", accountNumber: "12345", bankName: "GTBank" })).rejects.toThrow();
  });
});
