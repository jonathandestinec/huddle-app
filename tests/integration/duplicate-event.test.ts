import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { duplicateEvent } from "@/lib/events/service";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

describe("duplicating an event", () => {
  beforeEach(resetDb);

  it("copies details, functions and content as a fresh draft, without anyone's sign-ups", async () => {
    const org = await makeOrg();
    const ev = await makeEvent(org.id);
    await db.update(s.events).set({ status: "ended", venue: "Main hall", meetingUrl: "https://meet.example.com/x", coverKey: `covers/${org.id}/a.jpg` }).where(eq(s.events.id, ev.id));
    const picker = await makeFunction(ev.id, { type: "number_picker", gate: "code", accessCodeHash: "hash", config: { min: 1, max: 20, mode: "private" } });
    const content = await makeFunction(ev.id, { type: "extra_content" });
    await db.insert(s.contentItems).values({ eventFunctionId: content.id, kind: "link", title: "Slides", url: "https://example.com/s" });
    const u = await makeUser();
    await db.insert(s.numberClaims).values({ eventFunctionId: picker.id, number: 3, userId: u.id, status: "confirmed" });

    const copy = await duplicateEvent(ev.id);
    const [row] = await db.select().from(s.events).where(eq(s.events.id, copy.id));
    expect(row).toMatchObject({ status: "draft", venue: "Main hall", meetingUrl: "https://meet.example.com/x", coverKey: `covers/${org.id}/a.jpg` });
    expect(copy.slug).not.toBe(ev.slug);

    const fns = await db.select().from(s.eventFunctions).where(eq(s.eventFunctions.eventId, copy.id));
    expect(fns.map((f) => f.type).sort()).toEqual(["extra_content", "number_picker"]);
    const newPicker = fns.find((f) => f.type === "number_picker")!;
    expect(newPicker).toMatchObject({ gate: "code", accessCodeHash: "hash" });
    expect((newPicker.config as { mode: string }).mode).toBe("private");

    const newContent = fns.find((f) => f.type === "extra_content")!;
    expect(await db.select().from(s.contentItems).where(eq(s.contentItems.eventFunctionId, newContent.id))).toEqual([
      expect.objectContaining({ title: "Slides", url: "https://example.com/s" }),
    ]);
    expect(await db.select().from(s.numberClaims).where(eq(s.numberClaims.eventFunctionId, newPicker.id))).toHaveLength(0);
    // The original is untouched.
    expect(await db.select().from(s.numberClaims).where(eq(s.numberClaims.eventFunctionId, picker.id))).toHaveLength(1);
  });

  it("moves a past date forward by whole weeks, keeping the weekday and time", async () => {
    const org = await makeOrg();
    const ev = await makeEvent(org.id);
    const start = new Date("2026-11-01T08:00:00Z"); // a Sunday, 9am Lagos
    await db.update(s.events).set({ startsAt: start, endsAt: new Date("2026-11-01T10:00:00Z") }).where(eq(s.events.id, ev.id));
    const copy = await duplicateEvent(ev.id, new Date("2026-11-12T12:00:00Z"));
    const [row] = await db.select().from(s.events).where(eq(s.events.id, copy.id));
    expect(row.startsAt.toISOString()).toBe("2026-11-15T08:00:00.000Z");
    expect(row.endsAt?.toISOString()).toBe("2026-11-15T10:00:00.000Z");
  });

  it("keeps a future date as it is", async () => {
    const org = await makeOrg();
    const ev = await makeEvent(org.id);
    const start = new Date("2027-01-10T08:00:00Z");
    await db.update(s.events).set({ startsAt: start }).where(eq(s.events.id, ev.id));
    const copy = await duplicateEvent(ev.id, new Date("2026-11-12T12:00:00Z"));
    const [row] = await db.select().from(s.events).where(eq(s.events.id, copy.id));
    expect(row.startsAt.toISOString()).toBe(start.toISOString());
  });
});
