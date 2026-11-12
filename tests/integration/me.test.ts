import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn(async () => {}) }));
vi.mock("@/lib/paystack/client", async (orig) => ({
  ...(await orig<typeof import("@/lib/paystack/client")>()),
  initializeTransaction: vi.fn(async () => ({ authorizationUrl: "https://checkout.paystack.com/t" })),
  verifyTransaction: vi.fn(async (reference: string) => ({ status: "success", amountKobo: 200000, reference })),
}));

import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/send";
import { getEventOverview } from "@/lib/events/overview";
import { claimNumber } from "@/functions/number-picker/logic";
import { reserveSeat } from "@/functions/rsvp/logic";
import { getMyHuddles, meAccess } from "@/lib/me/queries";
import { settlePayment } from "@/lib/payments/settle";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

describe("getMyHuddles", () => {
  beforeEach(resetDb);

  it("groups by event with upcoming first and readable details", async () => {
    const org = await makeOrg();
    const past = await makeEvent(org.id, { title: "Last week", startsAt: new Date(Date.now() - 7 * 864e5) });
    const soon = await makeEvent(org.id, { title: "Next week", startsAt: new Date(Date.now() + 7 * 864e5) });
    const picker = await makeFunction(soon.id, { type: "number_picker", config: { min: 1, max: 100 } });
    const rsvp = await makeFunction(soon.id, { type: "rsvp", config: { capacity: null } });
    const old = await makeFunction(past.id, { type: "rsvp", config: { capacity: null } });
    const u = await makeUser();
    await claimNumber(u.id, picker.id, 42);
    await reserveSeat(u.id, rsvp.id);
    await reserveSeat(u.id, old.id);

    const mine = await getMyHuddles(u.id);
    expect(mine.map((m) => m.event.title)).toEqual(["Next week", "Last week"]);
    expect(mine[0].items.map((i) => i.detail).sort()).toEqual(["#42", "Seat reserved"]);
  });
});

describe("meAccess", () => {
  it("shows My Huddles only to verified emails", () => {
    expect(meAccess(null)).toBe("verify");
    expect(meAccess({ emailVerified: false })).toBe("verify");
    expect(meAccess({ emailVerified: true })).toBe("show");
  });
});

describe("emails and overview", () => {
  beforeEach(async () => {
    await resetDb();
    vi.mocked(sendEmail).mockReset().mockResolvedValue(undefined);
  });

  async function paidPicker() {
    const org = await makeOrg({ paystackSubaccountCode: "ACCT_x" });
    const ev = await makeEvent(org.id);
    const f = await makeFunction(ev.id, { type: "number_picker", config: { min: 1, max: 100 }, gate: "paid", priceKobo: 200000 });
    return { ev, f };
  }

  it("sends a receipt with the number after payment", async () => {
    const { f } = await paidPicker();
    const u = await makeUser({ email: "grace@example.com" });
    await claimNumber(u.id, f.id, 42);
    const [p] = await db.select().from(s.payments);
    await settlePayment(p.paystackReference, "webhook");
    await vi.waitFor(() => expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "grace@example.com" })));
    const subject = vi.mocked(sendEmail).mock.calls[0][0].subject;
    expect(subject).toContain("#42");
  });

  it("a failing email never fails settlement", async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error("resend down"));
    const { f } = await paidPicker();
    const u = await makeUser();
    await claimNumber(u.id, f.id, 7);
    const [p] = await db.select().from(s.payments);
    expect(await settlePayment(p.paystackReference, "webhook")).toBe("settled");
  });

  it("overview counts revenue as the org's share of successful payments only", async () => {
    const { ev, f } = await paidPicker();
    const [a, b] = [await makeUser(), await makeUser()];
    await claimNumber(a.id, f.id, 1);
    await claimNumber(b.id, f.id, 2);
    const [pa] = await db.select().from(s.payments);
    await settlePayment(pa.paystackReference, "webhook");
    const o = await getEventOverview(ev.id);
    expect(o).toEqual({ registrations: 1, numbersTaken: 1, revenueKobo: 190000 });
  });
});
