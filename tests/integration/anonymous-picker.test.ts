import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getHostState, callNextNumber } from "@/functions/number-picker/host";
import { claimAnonymous, claimNumber, getPickerState } from "@/functions/number-picker/logic";
import { attachFunction } from "@/lib/functions/service";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

async function anonPicker(overrides: Parameters<typeof makeFunction>[1] = {}) {
  const org = await makeOrg();
  const owner = await makeUser();
  await db.insert(s.memberships).values({ userId: owner.id, organisationId: org.id });
  const ev = await makeEvent(org.id);
  const f = await makeFunction(ev.id, { type: "number_picker", config: { min: 1, max: 50, anonymous: true }, ...overrides });
  return { f, owner, ev, org };
}
const dev = (d: string, ip = "ip-1") => ({ deviceHash: d, ipHash: ip });

describe("anonymous Number Picker", () => {
  beforeEach(resetDb);

  it("claims a number with no account at all", async () => {
    const { f } = await anonPicker();
    expect(await claimAnonymous(f.id, 6, dev("phone-a"))).toEqual({ ok: true, status: "confirmed" });
    const [c] = await db.select().from(s.numberClaims).where(eq(s.numberClaims.eventFunctionId, f.id));
    expect(c).toMatchObject({ number: 6, userId: null, status: "confirmed" });
    expect(await db.select().from(s.user)).toHaveLength(1); // only the owner
  });

  it("one number per device", async () => {
    const { f } = await anonPicker();
    await claimAnonymous(f.id, 6, dev("phone-a"));
    expect(await claimAnonymous(f.id, 7, dev("phone-a"))).toEqual({ ok: false, error: "You already hold #6" });
  });

  it("many phones on the same church Wi-Fi can each pick", async () => {
    const { f } = await anonPicker();
    for (let i = 1; i <= 5; i++) expect((await claimAnonymous(f.id, i, dev(`phone-${i}`, "church-wifi"))).ok).toBe(true);
  });

  it("two phones racing for one number: one wins", async () => {
    const { f } = await anonPicker();
    const r = await Promise.all(["a", "b", "c", "d"].map((d) => claimAnonymous(f.id, 9, dev(d))));
    expect(r.filter((x) => x.ok)).toHaveLength(1);
  });

  it("caps picks from one network at 30 per event", { timeout: 120_000 }, async () => {
    const { f } = await anonPicker();
    for (let i = 1; i <= 30; i++) await claimAnonymous(f.id, i, dev(`d${i}`, "one-ip"));
    expect(await claimAnonymous(f.id, 31, dev("d31", "one-ip"))).toEqual({ ok: false, error: "Too many picks from this network — ask the host for help" });
  });

  it("is refused on a picker that asks for names", async () => {
    const { f } = await anonPicker({ config: { min: 1, max: 50, anonymous: false } });
    await expect(claimAnonymous(f.id, 3, dev("x"))).rejects.toThrow();
  });

  it("code-gated anonymous pickers check the code on each pick", async () => {
    const { f } = await anonPicker({ gate: "code", accessCodeHash: await bcrypt.hash("GRACE", 4) });
    expect(await claimAnonymous(f.id, 3, { ...dev("x"), code: "nope" })).toEqual({ ok: false, error: "That code didn't work" });
    expect(await claimAnonymous(f.id, 3, { ...dev("x"), code: "GRACE" })).toEqual({ ok: true, status: "confirmed" });
  });

  it("state shows this device's number", async () => {
    const { f } = await anonPicker();
    await claimAnonymous(f.id, 12, dev("phone-a"));
    expect((await getPickerState(f.id, null, "phone-a")).mine).toEqual({ number: 12, status: "confirmed" });
    expect((await getPickerState(f.id, null, "phone-b")).mine).toBeNull();
  });

  it("host sees anonymous picks without names and can call the next one", async () => {
    const { f, owner } = await anonPicker();
    await claimAnonymous(f.id, 12, dev("a"));
    await claimAnonymous(f.id, 4, dev("b"));
    const hs = await getHostState(owner.id, f.id);
    expect(hs.claims.map((c) => [c.number, c.name])).toEqual([
      [4, null],
      [12, null],
    ]);
    expect(await callNextNumber(owner.id, f.id)).toBe(4);
    expect(await callNextNumber(owner.id, f.id)).toBe(12);
    expect(await callNextNumber(owner.id, f.id)).toBeNull();
  });

  it("anonymous mode can't be combined with a paid gate", async () => {
    const org = await makeOrg({ paystackSubaccountCode: "ACCT_x" });
    const ev = await makeEvent(org.id);
    await expect(
      attachFunction(ev.id, { type: "number_picker", gate: "paid", priceNaira: "500", config: { min: 1, max: 10, anonymous: true } }),
    ).rejects.toThrow("Anonymous picking works with Free or Access code");
  });
});

describe("email-only Number Picker", () => {
  beforeEach(resetDb);

  it("host sees numbers but never names or emails", async () => {
    const { f, owner } = await anonPicker({ config: { min: 1, max: 50, mode: "private" } });
    const ada = await makeUser({ name: "Ada Obi" });
    expect(await claimNumber(ada.id, f.id, 7)).toEqual({ ok: true, status: "confirmed" });
    const hs = await getHostState(owner.id, f.id);
    expect(hs.hideIdentity).toBe(true);
    expect(hs.claims).toEqual([expect.objectContaining({ number: 7, name: null, email: null })]);
    expect((await getPickerState(f.id, ada.id)).mine).toEqual({ number: 7, status: "confirmed" });
  });

  it("can be paid (Paystack gets the email)", async () => {
    const org = await makeOrg({ paystackSubaccountCode: "ACCT_x" });
    const ev = await makeEvent(org.id);
    const fn = await attachFunction(ev.id, { type: "number_picker", gate: "paid", priceNaira: "500", config: { min: 1, max: 10, mode: "private" } });
    const [row] = await db.select().from(s.eventFunctions).where(eq(s.eventFunctions.id, fn.id));
    expect(row.gate).toBe("paid");
  });

  it("older configs with only `anonymous` still read correctly", async () => {
    const { f } = await anonPicker();
    expect((await getPickerState(f.id, null)).mode).toBe("anonymous");
  });
});
