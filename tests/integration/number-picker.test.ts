import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/paystack/client", async (orig) => ({
  ...(await orig<typeof import("@/lib/paystack/client")>()),
  initializeTransaction: vi.fn(async () => ({ authorizationUrl: "https://checkout.paystack.com/t" })),
  verifyTransaction: vi.fn(async (reference: string) => ({ status: "success", amountKobo: 100000, reference })),
}));

import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { numberPickerConfigSchema } from "@/functions/number-picker/config";
import { claimNumber, getPickerState, sweepExpiredHolds } from "@/functions/number-picker/logic";
import { releaseHoldForReference, releaseMyHold } from "@/functions/number-picker/release";
import { settlePayment } from "@/lib/payments/settle";
import { initializeTransaction, verifyTransaction } from "@/lib/paystack/client";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

async function picker(overrides: Parameters<typeof makeFunction>[1] = {}, eventOverrides = {}) {
  const org = await makeOrg({ paystackSubaccountCode: "ACCT_x" });
  const ev = await makeEvent(org.id, eventOverrides);
  return makeFunction(ev.id, { type: "number_picker", config: { min: 1, max: 500 }, ...overrides });
}
const paid = { gate: "paid" as const, priceKobo: 100000 };
const claimsFor = (fid: string) => db.select().from(s.numberClaims).where(eq(s.numberClaims.eventFunctionId, fid));
const refFor = async (fid: string, userId: string) =>
  (await db.select().from(s.payments).where(and(eq(s.payments.eventFunctionId, fid), eq(s.payments.userId, userId))))[0];
const in11min = () => new Date(Date.now() + 11 * 60 * 1000);

describe("claimNumber (free)", () => {
  beforeEach(resetDb);

  it("50 people tap #42 at once: exactly one gets it", async () => {
    const f = await picker();
    const users = await Promise.all(Array.from({ length: 50 }, () => makeUser()));
    const results = await Promise.all(users.map((u) => claimNumber(u.id, f.id, 42)));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok && r.error === "Someone just grabbed #42. Try another?")).toHaveLength(49);
    expect(await claimsFor(f.id)).toHaveLength(1);
  });

  it("one number per person", async () => {
    const f = await picker();
    const u = await makeUser();
    expect(await claimNumber(u.id, f.id, 7)).toMatchObject({ ok: true, status: "confirmed" });
    expect(await claimNumber(u.id, f.id, 8)).toEqual({ ok: false, error: "You already hold #7" });
  });

  it("rejects numbers out of range", async () => {
    const f = await picker();
    expect(await claimNumber((await makeUser()).id, f.id, 501)).toEqual({ ok: false, error: "That number isn't in range" });
  });

  it("rejects claims after the event has ended", async () => {
    const f = await picker({}, { status: "ended" });
    expect(await claimNumber((await makeUser()).id, f.id, 3)).toEqual({ ok: false, error: "This event has ended" });
  });

  it("code-gated pickers require the code first", async () => {
    const f = await picker({ gate: "code", accessCodeHash: "x" });
    expect(await claimNumber((await makeUser()).id, f.id, 3)).toEqual({ ok: false, error: "Unlock this first" });
  });
});

describe("claimNumber (paid)", () => {
  beforeEach(resetDb);

  it("holds the number and starts checkout", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    const r = await claimNumber(u.id, f.id, 42);
    expect(r).toMatchObject({ ok: true, status: "held", authorizationUrl: "https://checkout.paystack.com/t" });
    const [c] = await claimsFor(f.id);
    expect(c.status).toBe("held");
    const p = await refFor(f.id, u.id);
    expect(p.metadata).toMatchObject({ claimId: c.id, number: 42 });
  });

  it("confirms the held number when payment settles", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    await claimNumber(u.id, f.id, 42);
    await settlePayment((await refFor(f.id, u.id)).paystackReference, "webhook");
    const [c] = await claimsFor(f.id);
    expect(c).toMatchObject({ number: 42, status: "confirmed", holdExpiresAt: null });
  });

  it("lets someone re-pick while their hold is unpaid", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    await claimNumber(u.id, f.id, 42);
    expect(await claimNumber(u.id, f.id, 43)).toMatchObject({ ok: true, status: "held" });
    expect((await claimsFor(f.id)).map((c) => c.number)).toEqual([43]);
  });
});

describe("releasing an unpaid hold", () => {
  beforeEach(resetDb);
  const verify = () => vi.mocked(verifyTransaction);

  it("back without paying: the number is free again and the payment is abandoned", async () => {
    const f = await picker(paid);
    const [u, other] = [await makeUser(), await makeUser()];
    await claimNumber(u.id, f.id, 42);
    verify().mockResolvedValueOnce({ status: "abandoned", amountKobo: 100000, reference: "x" });
    expect(await releaseMyHold(u.id, f.id)).toEqual({ status: "released", number: 42 });
    expect(await claimsFor(f.id)).toHaveLength(0);
    expect((await refFor(f.id, u.id)).status).toBe("abandoned");
    expect(await claimNumber(other.id, f.id, 42)).toMatchObject({ ok: true, status: "held" });
  });

  it("paid after all: confirms the number instead of releasing it", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    await claimNumber(u.id, f.id, 42);
    expect(await releaseMyHold(u.id, f.id)).toEqual({ status: "paid", number: 42 });
    expect(await claimsFor(f.id)).toMatchObject([{ number: 42, status: "confirmed" }]);
  });

  it("still processing (e.g. bank transfer): keeps the hold", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    await claimNumber(u.id, f.id, 42);
    verify().mockResolvedValueOnce({ status: "ongoing", amountKobo: 100000, reference: "x" });
    expect(await releaseMyHold(u.id, f.id)).toEqual({ status: "processing", number: 42 });
    expect(await claimsFor(f.id)).toMatchObject([{ number: 42, status: "held" }]);
  });

  it("Paystack unreachable: keeps the hold", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    await claimNumber(u.id, f.id, 42);
    verify().mockRejectedValueOnce(new Error("down"));
    expect(await releaseMyHold(u.id, f.id)).toEqual({ status: "processing", number: 42 });
    expect(await claimsFor(f.id)).toHaveLength(1);
  });

  it("Cancel payment on checkout releases by reference", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    await claimNumber(u.id, f.id, 42);
    verify().mockResolvedValueOnce({ status: "abandoned", amountKobo: 100000, reference: "x" });
    expect(await releaseHoldForReference((await refFor(f.id, u.id)).paystackReference)).toEqual({ status: "released", number: 42 });
    expect(await claimsFor(f.id)).toHaveLength(0);
  });

  it("does nothing to confirmed numbers or people with no hold", async () => {
    const f = await picker();
    const u = await makeUser();
    await claimNumber(u.id, f.id, 7);
    expect(await releaseMyHold(u.id, f.id)).toEqual({ status: "none" });
    expect(await releaseMyHold((await makeUser()).id, f.id)).toEqual({ status: "none" });
    expect(await claimsFor(f.id)).toHaveLength(1);
  });

  it("asks Paystack to send Cancel payment back to the return page", async () => {
    const f = await picker(paid);
    await claimNumber((await makeUser()).id, f.id, 42);
    const meta = vi.mocked(initializeTransaction).mock.calls.at(-1)![0].metadata;
    expect(meta.cancel_action).toMatch(/\/paid\?ref=hud_[0-9a-f]+&cancelled=1$/);
  });
});

describe("sweepExpiredHolds", () => {
  beforeEach(resetDb);

  it("releases holds older than 10 minutes and marks their payments abandoned", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    await claimNumber(u.id, f.id, 42);
    expect(await sweepExpiredHolds(new Date(Date.now() + 9 * 60 * 1000))).toBe(0);
    expect(await sweepExpiredHolds(in11min())).toBe(1);
    expect(await claimsFor(f.id)).toHaveLength(0);
    expect((await refFor(f.id, u.id)).status).toBe("abandoned");
  });

  it("late payment: number still free → confirmed", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    await claimNumber(u.id, f.id, 42);
    await sweepExpiredHolds(in11min());
    await settlePayment((await refFor(f.id, u.id)).paystackReference, "webhook");
    expect(await claimsFor(f.id)).toMatchObject([{ number: 42, status: "confirmed", userId: u.id }]);
  });

  it("late payment: number taken → access kept, picks another without paying", async () => {
    const f = await picker(paid);
    const [u, other] = [await makeUser(), await makeUser()];
    await claimNumber(u.id, f.id, 42);
    await sweepExpiredHolds(in11min());
    await db.insert(s.numberClaims).values({ eventFunctionId: f.id, number: 42, userId: other.id, status: "confirmed" });
    await settlePayment((await refFor(f.id, u.id)).paystackReference, "webhook");
    expect((await getPickerState(f.id, u.id)).mine).toBeNull();
    expect(await claimNumber(u.id, f.id, 50)).toMatchObject({ ok: true, status: "confirmed" });
  });
});

describe("getPickerState", () => {
  beforeEach(resetDb);

  it("lists taken numbers, mine and the latest called number", async () => {
    const f = await picker();
    const [a, b] = [await makeUser(), await makeUser()];
    await claimNumber(a.id, f.id, 3);
    await claimNumber(b.id, f.id, 9);
    await db.update(s.numberClaims).set({ calledAt: new Date() }).where(eq(s.numberClaims.number, 9));
    expect(await getPickerState(f.id, a.id)).toEqual({ anonymous: false, mode: "named", min: 1, max: 500, taken: [3, 9], mine: { number: 3, status: "confirmed" }, called: 9 });
  });

  it("does not count expired holds as taken", async () => {
    const f = await picker(paid);
    const u = await makeUser();
    await claimNumber(u.id, f.id, 42);
    await db.update(s.numberClaims).set({ holdExpiresAt: new Date(Date.now() - 1000) });
    expect((await getPickerState(f.id, null)).taken).toEqual([]);
  });
});

describe("config", () => {
  it("rejects more than 10,000 numbers", () => {
    expect(numberPickerConfigSchema.safeParse({ min: 1, max: 20000 }).success).toBe(false);
  });
});
