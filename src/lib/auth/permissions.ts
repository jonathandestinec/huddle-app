import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

export class ForbiddenError extends Error {
  constructor(message = "You don't have access to this") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Owners must have proven their email: an unverified (attendee-style) account can never act as an organiser. */
export async function assertOrgOwner(userId: string, organisationId: string): Promise<void> {
  const [m] = await db
    .select({ role: s.memberships.role, verified: s.user.emailVerified })
    .from(s.memberships)
    .innerJoin(s.user, eq(s.user.id, s.memberships.userId))
    .where(and(eq(s.memberships.userId, userId), eq(s.memberships.organisationId, organisationId)))
    .limit(1);
  if (m?.role !== "owner" || !m.verified) throw new ForbiddenError();
}

export async function assertVerified(userId: string): Promise<void> {
  const [u] = await db.select({ v: s.user.emailVerified }).from(s.user).where(eq(s.user.id, userId)).limit(1);
  if (!u?.v) throw new ForbiddenError("Confirm your email first — sign in with the link we send you.");
}
