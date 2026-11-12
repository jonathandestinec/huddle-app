import { beforeEach, describe, expect, it } from "vitest";
import { createEvent, getPublicEvent, publishEvent } from "@/lib/events/service";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { makeOrg, makeUser, resetDb } from "./setup";

const base = { title: "Sunday Service", startsAtLocal: "2026-11-16T09:00" };

describe("events", () => {
  beforeEach(resetDb);

  it("stores the start time as the right UTC instant", async () => {
    const org = await makeOrg();
    const ev = await createEvent(org.id, base);
    const pub = await getPublicEvent(org.slug, ev.slug, null, { includeDrafts: true });
    expect(pub?.event.startsAt.toISOString()).toBe("2026-11-16T08:00:00.000Z");
  });

  it("rejects an end before the start", async () => {
    const org = await makeOrg();
    await expect(createEvent(org.id, { ...base, endsAtLocal: "2026-11-16T08:00" })).rejects.toThrow(
      "The event can't end before it starts",
    );
  });

  it("suffixes duplicate slugs within an org", async () => {
    const org = await makeOrg();
    const a = await createEvent(org.id, base);
    const b = await createEvent(org.id, base);
    expect(a.slug).toBe("sunday-service");
    expect(b.slug).toBe("sunday-service-2");
  });

  it("hides drafts from anonymous viewers and shows them to the owner", async () => {
    const [org, owner] = [await makeOrg(), await makeUser()];
    await db.insert(s.memberships).values({ userId: owner.id, organisationId: org.id });
    const ev = await createEvent(org.id, base);
    expect(await getPublicEvent(org.slug, ev.slug, null)).toBeNull();
    expect(await getPublicEvent(org.slug, ev.slug, owner.id)).not.toBeNull();
    await publishEvent(ev.id);
    expect(await getPublicEvent(org.slug, ev.slug, null)).not.toBeNull();
  });

  it("requires http(s) meeting links", async () => {
    const org = await makeOrg();
    await expect(createEvent(org.id, { ...base, meetingUrl: "javascript:alert(1)" })).rejects.toThrow();
  });
});
