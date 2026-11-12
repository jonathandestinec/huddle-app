import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { attachFunction, removeFunction, updateFunction } from "@/lib/functions/service";
import { makeEvent, makeOrg, makeUser, resetDb } from "./setup";

async function setup(withBank = true) {
  const org = await makeOrg({ paystackSubaccountCode: withBank ? "ACCT_x" : null });
  const ev = await makeEvent(org.id);
  return { org, ev };
}

describe("attachFunction", () => {
  beforeEach(resetDb);

  it("refuses a paid gate when the org has no bank linked", async () => {
    const { ev } = await setup(false);
    await expect(
      attachFunction(ev.id, { type: "rsvp", gate: "paid", priceNaira: "1000", config: { capacity: null } }),
    ).rejects.toThrow("Link a bank account to charge for this");
  });

  it("refuses prices under ₦100", async () => {
    const { ev } = await setup();
    await expect(
      attachFunction(ev.id, { type: "rsvp", gate: "paid", priceNaira: "99", config: { capacity: null } }),
    ).rejects.toThrow("₦100");
  });

  it("stores price in kobo", async () => {
    const { ev } = await setup();
    const f = await attachFunction(ev.id, { type: "rsvp", gate: "paid", priceNaira: "2,000", config: { capacity: null } });
    const [row] = await db.select().from(s.eventFunctions).where(eq(s.eventFunctions.id, f.id));
    expect(row.priceKobo).toBe(200000);
  });

  it("hashes access codes", async () => {
    const { ev } = await setup();
    const f = await attachFunction(ev.id, { type: "extra_content", gate: "code", accessCode: "GRACE", config: {} });
    const [row] = await db.select().from(s.eventFunctions).where(eq(s.eventFunctions.id, f.id));
    expect(row.accessCodeHash).not.toBe("GRACE");
    expect(await bcrypt.compare("GRACE", row.accessCodeHash!)).toBe(true);
  });

  it("refuses short access codes", async () => {
    const { ev } = await setup();
    await expect(attachFunction(ev.id, { type: "extra_content", gate: "code", accessCode: "abc", config: {} })).rejects.toThrow(
      "at least 4",
    );
  });

  it("refuses a second function of the same type", async () => {
    const { ev } = await setup();
    await attachFunction(ev.id, { type: "rsvp", gate: "free", config: { capacity: null } });
    await expect(attachFunction(ev.id, { type: "rsvp", gate: "free", config: { capacity: null } })).rejects.toThrow(
      "This event already has RSVP & Seats",
    );
  });

  it("validates config with the function's schema", async () => {
    const { ev } = await setup();
    await expect(
      attachFunction(ev.id, { type: "number_picker", gate: "free", config: { min: 1, max: 20000 } }),
    ).rejects.toThrow();
  });
});

describe("after someone has access", () => {
  beforeEach(resetDb);

  async function withEntitlement() {
    const { ev } = await setup();
    const f = await attachFunction(ev.id, { type: "rsvp", gate: "paid", priceNaira: "1000", config: { capacity: null } });
    const u = await makeUser();
    await db.insert(s.entitlements).values({ userId: u.id, eventFunctionId: f.id, source: "payment" });
    return f;
  }

  it("refuses to change the gate", async () => {
    const f = await withEntitlement();
    await expect(updateFunction(f.id, { gate: "free" })).rejects.toThrow("People already have access to this");
  });

  it("refuses removal", async () => {
    const f = await withEntitlement();
    await expect(removeFunction(f.id)).rejects.toThrow("People already have access to this");
  });

  it("allows a new price for future buyers", async () => {
    const f = await withEntitlement();
    await updateFunction(f.id, { priceNaira: "1500" });
    const [row] = await db.select().from(s.eventFunctions).where(eq(s.eventFunctions.id, f.id));
    expect(row.priceKobo).toBe(150000);
  });
});
