import { beforeEach, describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { callNumber, getHostState, uncallNumber } from "@/functions/number-picker/host";
import { claimNumber, getPickerState } from "@/functions/number-picker/logic";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

async function hosted() {
  const org = await makeOrg();
  const owner = await makeUser();
  await db.insert(s.memberships).values({ userId: owner.id, organisationId: org.id });
  const ev = await makeEvent(org.id);
  const f = await makeFunction(ev.id, { type: "number_picker", config: { min: 1, max: 100 } });
  return { owner, f };
}

describe("host live", () => {
  beforeEach(resetDb);

  it("only owners can call numbers", async () => {
    const { f } = await hosted();
    const stranger = await makeUser();
    await claimNumber(stranger.id, f.id, 7);
    await expect(callNumber(stranger.id, f.id, 7)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("can't call a number nobody holds", async () => {
    const { owner, f } = await hosted();
    await expect(callNumber(owner.id, f.id, 7)).rejects.toThrow("Nobody holds #7 yet");
  });

  it("the latest call is what attendees see", async () => {
    const { owner, f } = await hosted();
    const [a, b] = [await makeUser(), await makeUser()];
    await claimNumber(a.id, f.id, 7);
    await claimNumber(b.id, f.id, 9);
    await callNumber(owner.id, f.id, 7);
    expect((await getPickerState(f.id, null)).called).toBe(7);
    await new Promise((r) => setTimeout(r, 20));
    await callNumber(owner.id, f.id, 9);
    expect((await getPickerState(f.id, null)).called).toBe(9);
    await uncallNumber(owner.id, f.id, 9);
    expect((await getPickerState(f.id, null)).called).toBe(7);
  });

  it("host state lists who holds what", async () => {
    const { owner, f } = await hosted();
    const a = await makeUser({ name: "Grace Eze" });
    await claimNumber(a.id, f.id, 12);
    const state = await getHostState(owner.id, f.id);
    expect(state.claims).toEqual([expect.objectContaining({ number: 12, name: "Grace Eze", status: "confirmed", calledAt: null })]);
  });
});
