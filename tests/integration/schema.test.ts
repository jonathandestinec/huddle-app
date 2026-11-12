import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

function pgCode(err: unknown): string | undefined {
  let e = err as { code?: string; cause?: unknown } | undefined;
  while (e) {
    if (e.code) return e.code;
    e = e.cause as typeof e;
  }
  return undefined;
}

async function expectUniqueViolation(p: Promise<unknown>) {
  const err = await p.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(pgCode(err)).toBe("23505");
}

describe("schema integrity", () => {
  beforeEach(resetDb);

  it("rejects two claims on the same number", async () => {
    const [a, b] = [await makeUser(), await makeUser()];
    const ev = await makeEvent((await makeOrg()).id);
    const fn = await makeFunction(ev.id);
    await db.insert(s.numberClaims).values({ eventFunctionId: fn.id, number: 42, userId: a.id, status: "confirmed" });
    await expectUniqueViolation(
      db.insert(s.numberClaims).values({ eventFunctionId: fn.id, number: 42, userId: b.id, status: "confirmed" }),
    );
  });

  it("rejects a second claim by the same user on one function", async () => {
    const a = await makeUser();
    const ev = await makeEvent((await makeOrg()).id);
    const fn = await makeFunction(ev.id);
    await db.insert(s.numberClaims).values({ eventFunctionId: fn.id, number: 7, userId: a.id, status: "confirmed" });
    await expectUniqueViolation(
      db.insert(s.numberClaims).values({ eventFunctionId: fn.id, number: 8, userId: a.id, status: "confirmed" }),
    );
  });

  it("rejects duplicate payment references", async () => {
    const a = await makeUser();
    const ev = await makeEvent((await makeOrg()).id);
    const fn = await makeFunction(ev.id, { gate: "paid", priceKobo: 100000 });
    const row = { userId: a.id, eventFunctionId: fn.id, paystackReference: "hud_1", amountKobo: 100000, huddleFeeKobo: 5000 };
    await db.insert(s.payments).values(row);
    await expectUniqueViolation(db.insert(s.payments).values(row));
  });

  it("rejects a second function of the same type on one event", async () => {
    const ev = await makeEvent((await makeOrg()).id);
    await makeFunction(ev.id, { type: "rsvp", config: { capacity: null } });
    await expectUniqueViolation(makeFunction(ev.id, { type: "rsvp", config: { capacity: null } }));
  });
});
