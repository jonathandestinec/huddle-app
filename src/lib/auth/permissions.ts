import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

export class ForbiddenError extends Error {
  constructor(message = "You don't have access to this") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function assertOrgOwner(userId: string, organisationId: string): Promise<void> {
  const [m] = await db
    .select({ role: s.memberships.role })
    .from(s.memberships)
    .where(and(eq(s.memberships.userId, userId), eq(s.memberships.organisationId, organisationId)))
    .limit(1);
  if (m?.role !== "owner") throw new ForbiddenError();
}
