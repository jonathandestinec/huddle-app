import { beforeEach, describe, expect, it } from "vitest";
import { assertOrgOwner, ForbiddenError } from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { makeOrg, makeUser, resetDb } from "./setup";

describe("assertOrgOwner", () => {
  beforeEach(resetDb);

  it("passes for the owner", async () => {
    const [u, o] = [await makeUser(), await makeOrg()];
    await db.insert(s.memberships).values({ userId: u.id, organisationId: o.id });
    await expect(assertOrgOwner(u.id, o.id)).resolves.toBeUndefined();
  });

  it("throws ForbiddenError for a non-member", async () => {
    const [u, o] = [await makeUser(), await makeOrg()];
    await expect(assertOrgOwner(u.id, o.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
