import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/paystack/client", async (orig) => ({
  ...(await orig<typeof import("@/lib/paystack/client")>()),
  initializeTransaction: vi.fn(async () => ({ authorizationUrl: "https://checkout.paystack.com/test" })),
  verifyTransaction: vi.fn(),
}));

import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getFunctionDefinition } from "@/functions/registry";
import { initializeTransaction, verifyTransaction } from "@/lib/paystack/client";
import { settlePayment } from "@/lib/payments/settle";
import { startPaidUnlock } from "@/lib/payments/start";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

async function paidSetup() {
  const org = await makeOrg({ slug: "wc", paystackSubaccountCode: "ACCT_x", feeBps: 500 });
  const ev = await makeEvent(org.id, { slug: "sunday" });
  const f = await makeFunction(ev.id, { type: "extra_content", config: {}, gate: "paid", priceKobo: 200000 });
  const u = await makeUser({ email: "grace@example.com" });
  return { f, u };
}

const succeed = (amount = 200000) =>
  vi.mocked(verifyTransaction).mockImplementation(async (reference) => ({ status: "success", amountKobo: amount, reference }));

const entitlementsFor = (fid: string) => db.select().from(s.entitlements).where(eq(s.entitlements.eventFunctionId, fid));

describe("startPaidUnlock", () => {
  beforeEach(resetDb);

  it("creates a pending payment with Huddle's 5% and the org's subaccount", async () => {
    const { f, u } = await paidSetup();
    const r = await startPaidUnlock(u.id, f.id, { claimId: "c1" });
    expect(r.authorizationUrl).toBe("https://checkout.paystack.com/test");
    expect(r.reference).toMatch(/^hud_[a-z0-9]{20,}$/);
    const [p] = await db.select().from(s.payments).where(eq(s.payments.paystackReference, r.reference));
    expect(p).toMatchObject({ status: "pending", amountKobo: 200000, huddleFeeKobo: 10000, metadata: { claimId: "c1" } });
    expect(vi.mocked(initializeTransaction).mock.calls.at(-1)![0]).toMatchObject({
      email: "grace@example.com",
      amountKobo: 200000,
      subaccount: "ACCT_x",
      transactionChargeKobo: 10000,
      callbackUrl: `http://localhost:3000/wc/sunday/paid?ref=${r.reference}`,
    });
  });

  it("refuses when the user already has access", async () => {
    const { f, u } = await paidSetup();
    await db.insert(s.entitlements).values({ userId: u.id, eventFunctionId: f.id, source: "payment" });
    await expect(startPaidUnlock(u.id, f.id, {})).rejects.toThrow("You already have this");
  });
});

describe("settlePayment", () => {
  beforeEach(async () => {
    await resetDb();
    vi.mocked(verifyTransaction).mockReset();
  });
  afterEach(() => {
    getFunctionDefinition("extra_content").onEntitled = undefined;
  });

  it("settles once, then reports already settled", async () => {
    const { f, u } = await paidSetup();
    const { reference } = await startPaidUnlock(u.id, f.id, {});
    succeed();
    expect(await settlePayment(reference, "webhook")).toBe("settled");
    expect(await settlePayment(reference, "verify")).toBe("already_settled");
    expect(await entitlementsFor(f.id)).toHaveLength(1);
  });

  it("grants exactly one entitlement under 10 concurrent settlements", async () => {
    const { f, u } = await paidSetup();
    const { reference } = await startPaidUnlock(u.id, f.id, {});
    succeed();
    const results = await Promise.all(Array.from({ length: 10 }, () => settlePayment(reference, "webhook")));
    expect(results.filter((r) => r === "settled")).toHaveLength(1);
    expect(await entitlementsFor(f.id)).toHaveLength(1);
  });

  it("refuses when Paystack's amount doesn't match", async () => {
    const { f, u } = await paidSetup();
    const { reference } = await startPaidUnlock(u.id, f.id, {});
    succeed(100);
    expect(await settlePayment(reference, "webhook")).toBe("not_successful");
    expect(await entitlementsFor(f.id)).toHaveLength(0);
  });

  it("marks abandoned payments", async () => {
    const { f, u } = await paidSetup();
    const { reference } = await startPaidUnlock(u.id, f.id, {});
    vi.mocked(verifyTransaction).mockResolvedValue({ status: "abandoned", amountKobo: 200000, reference });
    expect(await settlePayment(reference, "verify")).toBe("not_successful");
    const [p] = await db.select().from(s.payments).where(eq(s.payments.paystackReference, reference));
    expect(p.status).toBe("abandoned");
    expect(await entitlementsFor(f.id)).toHaveLength(0);
  });

  it("ignores unknown references", async () => {
    succeed();
    expect(await settlePayment("hud_unknown", "webhook")).toBe("not_successful");
  });

  it("runs the function's onEntitled hook once, with the payment", async () => {
    const { f, u } = await paidSetup();
    const hook = vi.fn(async () => {});
    getFunctionDefinition("extra_content").onEntitled = hook;
    const { reference } = await startPaidUnlock(u.id, f.id, { claimId: "c9" });
    succeed();
    await settlePayment(reference, "webhook");
    await settlePayment(reference, "webhook");
    expect(hook).toHaveBeenCalledTimes(1);
    expect((hook.mock.calls[0] as unknown as [{ payment: { metadata: unknown } }])[0].payment.metadata).toMatchObject({ claimId: "c9" });
  });
});
