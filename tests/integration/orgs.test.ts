import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { createOrganisation, getMyOrganisations } from "@/lib/orgs/service";
import { makeOrg, makeUser, resetDb } from "./setup";

describe("createOrganisation", () => {
  beforeEach(resetDb);

  it("rejects a reserved slug", async () => {
    const u = await makeUser();
    await expect(createOrganisation(u.id, { name: "Dash", slug: "dashboard" })).rejects.toThrow("That link is taken");
  });

  it("rejects a duplicate slug", async () => {
    const u = await makeUser();
    await makeOrg({ slug: "watchers" });
    await expect(createOrganisation(u.id, { name: "Watchers", slug: "watchers" })).rejects.toThrow(
      "That link is taken",
    );
  });

  it("creates the org with a 5% fee and exactly one owner membership", async () => {
    const u = await makeUser();
    const org = await createOrganisation(u.id, { name: "Watchers Channel", slug: "watchers" });
    const [row] = await db.select().from(s.organisations).where(eq(s.organisations.id, org.id));
    expect(row.feeBps).toBe(500);
    const ms = await db.select().from(s.memberships).where(eq(s.memberships.organisationId, org.id));
    expect(ms).toEqual([{ userId: u.id, organisationId: org.id, role: "owner" }]);
    expect(await getMyOrganisations(u.id)).toHaveLength(1);
  });

  it("rejects an invalid slug shape", async () => {
    const u = await makeUser();
    await expect(createOrganisation(u.id, { name: "X", slug: "Has Spaces" })).rejects.toThrow();
  });
});
