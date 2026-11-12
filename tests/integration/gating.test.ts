import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getAccess, unlockFree, unlockWithCode } from "@/lib/gating/access";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

async function fn(overrides: Parameters<typeof makeFunction>[1] = {}) {
  const ev = await makeEvent((await makeOrg()).id);
  return makeFunction(ev.id, { type: "extra_content", config: {}, ...overrides });
}

describe("gating", () => {
  beforeEach(resetDb);

  it("anonymous viewers are locked out", async () => {
    const f = await fn();
    expect(await getAccess(null, f.id)).toEqual({ state: "locked", gate: "free", priceKobo: null });
  });

  it("free unlock grants access once, even if called twice", async () => {
    const [f, u] = [await fn(), await makeUser()];
    await unlockFree(u.id, f.id);
    await unlockFree(u.id, f.id);
    expect((await getAccess(u.id, f.id)).state).toBe("unlocked");
    const rows = await db.select().from(s.entitlements).where(eq(s.entitlements.eventFunctionId, f.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("free");
  });

  it("free unlock is refused on a paid function", async () => {
    const [f, u] = [await fn({ gate: "paid", priceKobo: 100000 }), await makeUser()];
    await expect(unlockFree(u.id, f.id)).rejects.toThrow();
  });

  describe("access codes", () => {
    async function coded() {
      return fn({ gate: "code", accessCodeHash: await bcrypt.hash("GRACE", 4) });
    }

    it("wrong code gives a generic error and records the attempt", async () => {
      const [f, u] = [await coded(), await makeUser()];
      expect(await unlockWithCode(u.id, f.id, "nope", "ip1")).toEqual({ ok: false, error: "That code didn't work" });
      const attempts = await db.select().from(s.codeAttempts).where(eq(s.codeAttempts.eventFunctionId, f.id));
      expect(attempts).toHaveLength(1);
    });

    it("right code unlocks with source code", async () => {
      const [f, u] = [await coded(), await makeUser()];
      expect(await unlockWithCode(u.id, f.id, " GRACE ", "ip1")).toEqual({ ok: true });
      const [e] = await db.select().from(s.entitlements).where(eq(s.entitlements.eventFunctionId, f.id));
      expect(e.source).toBe("code");
    });

    it("blocks the 6th attempt in 10 minutes, even with the right code", async () => {
      const [f, u] = [await coded(), await makeUser()];
      for (let i = 0; i < 5; i++) await unlockWithCode(u.id, f.id, "nope", "ip1");
      expect(await unlockWithCode(u.id, f.id, "GRACE", "ip1")).toEqual({
        ok: false,
        error: "Too many tries — wait a few minutes",
      });
    });

    it("ignores attempts older than 10 minutes", async () => {
      const [f, u] = [await coded(), await makeUser()];
      const old = new Date(Date.now() - 11 * 60 * 1000);
      await db.insert(s.codeAttempts).values(Array.from({ length: 5 }, () => ({ eventFunctionId: f.id, ipHash: "ip1", attemptedAt: old })));
      expect(await unlockWithCode(u.id, f.id, "GRACE", "ip1")).toEqual({ ok: true });
    });

    it("limits per IP, not globally", async () => {
      const [f, u] = [await coded(), await makeUser()];
      for (let i = 0; i < 5; i++) await unlockWithCode(u.id, f.id, "nope", "ip1");
      expect(await unlockWithCode(u.id, f.id, "GRACE", "ip2")).toEqual({ ok: true });
    });
  });
});
