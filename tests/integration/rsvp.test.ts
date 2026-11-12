import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn(async () => {}) }));
vi.mock("@/lib/paystack/client", async (orig) => ({
  ...(await orig<typeof import("@/lib/paystack/client")>()),
  initializeTransaction: vi.fn(async () => ({ authorizationUrl: "https://checkout.paystack.com/t" })),
  verifyTransaction: vi.fn(async (reference: string) => ({ status: "success", amountKobo: 100000, reference })),
}));

import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/send";
import { reserveSeat, seatsLeft } from "@/functions/rsvp/logic";
import { settlePayment } from "@/lib/payments/settle";
import { startPaidUnlock } from "@/lib/payments/start";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

async function rsvpFn(capacity: number | null, overrides: Parameters<typeof makeFunction>[1] = {}, eventOverrides = {}) {
  const org = await makeOrg({ paystackSubaccountCode: "ACCT_x" });
  const ev = await makeEvent(org.id, eventOverrides);
  const f = await makeFunction(ev.id, { type: "rsvp", config: { capacity }, ...overrides });
  return { org, ev, f };
}

const rsvpsFor = (fid: string) => db.select().from(s.rsvps).where(eq(s.rsvps.eventFunctionId, fid));

describe("reserveSeat", () => {
  beforeEach(async () => {
    await resetDb();
    vi.mocked(sendEmail).mockClear();
  });

  it("never overbooks: capacity 3, 10 people at once", async () => {
    const { f } = await rsvpFn(3);
    const users = await Promise.all(Array.from({ length: 10 }, () => makeUser()));
    const results = await Promise.all(users.map((u) => reserveSeat(u.id, f.id)));
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect(results.filter((r) => !r.ok && r.error === "This one's full")).toHaveLength(7);
    expect(await rsvpsFor(f.id)).toHaveLength(3);
    expect(await seatsLeft(f.id)).toBe(0);
  });

  it("is idempotent for the same person", async () => {
    const { f } = await rsvpFn(5);
    const u = await makeUser();
    expect(await reserveSeat(u.id, f.id)).toEqual({ ok: true });
    expect(await reserveSeat(u.id, f.id)).toEqual({ ok: true });
    expect(await rsvpsFor(f.id)).toHaveLength(1);
  });

  it("has no limit when capacity is null", async () => {
    const { f } = await rsvpFn(null);
    for (let i = 0; i < 5; i++) expect((await reserveSeat((await makeUser()).id, f.id)).ok).toBe(true);
    expect(await seatsLeft(f.id)).toBeNull();
  });

  it("asks paid RSVPs to unlock first", async () => {
    const { f } = await rsvpFn(5, { gate: "paid", priceKobo: 100000 });
    expect(await reserveSeat((await makeUser()).id, f.id)).toEqual({ ok: false, error: "Unlock this first" });
  });

  it("refuses after the event has ended", async () => {
    const { f } = await rsvpFn(5, {}, { status: "ended" });
    expect(await reserveSeat((await makeUser()).id, f.id)).toEqual({ ok: false, error: "This event has ended" });
  });

  it("reserves the seat automatically when a payment settles", async () => {
    const { f } = await rsvpFn(5, { gate: "paid", priceKobo: 100000 });
    const u = await makeUser();
    const { reference } = await startPaidUnlock(u.id, f.id, {});
    expect(await settlePayment(reference, "webhook")).toBe("settled");
    expect(await rsvpsFor(f.id)).toHaveLength(1);
  });

  it("keeps a paid entitlement and tells the owner if it filled up during payment", async () => {
    const { org, f } = await rsvpFn(1, { gate: "paid", priceKobo: 100000 });
    const owner = await makeUser({ email: "owner@example.com" });
    await db.insert(s.memberships).values({ userId: owner.id, organisationId: org.id });
    const [a, b] = [await makeUser(), await makeUser()];
    const { reference } = await startPaidUnlock(b.id, f.id, {});
    await db.insert(s.entitlements).values({ userId: a.id, eventFunctionId: f.id, source: "payment" });
    await db.insert(s.rsvps).values({ userId: a.id, eventFunctionId: f.id });

    expect(await settlePayment(reference, "webhook")).toBe("settled");
    const ents = await db.select().from(s.entitlements).where(eq(s.entitlements.userId, b.id));
    expect(ents).toHaveLength(1);
    expect(await rsvpsFor(f.id)).toHaveLength(1);
    await vi.waitFor(() => expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "owner@example.com" })));
  });
});
