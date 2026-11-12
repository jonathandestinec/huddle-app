import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertVerified } from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { UserError, isUniqueViolation } from "@/lib/errors";
import { SLUG_PATTERN, isReservedSlug } from "@/lib/slug";

export type Org = typeof s.organisations.$inferSelect;

const createInput = z.object({
  name: z.string().trim().min(2, "Give your organisation a name").max(80),
  slug: z.string().trim().min(2).max(48).regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens"),
  logoKey: z.string().optional(),
});

export async function isSlugAvailable(slug: string): Promise<boolean> {
  if (isReservedSlug(slug) || !SLUG_PATTERN.test(slug)) return false;
  const [hit] = await db.select({ id: s.organisations.id }).from(s.organisations).where(eq(s.organisations.slug, slug)).limit(1);
  return !hit;
}

export async function createOrganisation(
  userId: string,
  raw: z.input<typeof createInput>,
): Promise<{ id: string; slug: string }> {
  const input = createInput.parse(raw);
  await assertVerified(userId);
  if (isReservedSlug(input.slug)) throw new UserError("That link is taken");
  if (input.logoKey && !input.logoKey.startsWith(`logos/u-${userId}/`)) throw new UserError("Upload the logo again");
  try {
    return await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(s.organisations)
        .values({ name: input.name, slug: input.slug, logoKey: input.logoKey })
        .returning({ id: s.organisations.id, slug: s.organisations.slug });
      await tx.insert(s.memberships).values({ userId, organisationId: org.id, role: "owner" });
      return org;
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new UserError("That link is taken");
    throw err;
  }
}

export async function getMyOrganisations(userId: string): Promise<Org[]> {
  const rows = await db
    .select({ org: s.organisations })
    .from(s.memberships)
    .innerJoin(s.organisations, eq(s.organisations.id, s.memberships.organisationId))
    .where(eq(s.memberships.userId, userId));
  return rows.map((r) => r.org);
}

export async function getOrgBySlug(slug: string): Promise<Org | null> {
  const [o] = await db.select().from(s.organisations).where(eq(s.organisations.slug, slug)).limit(1);
  return o ?? null;
}

export async function getOrgById(id: string): Promise<Org | null> {
  const [o] = await db.select().from(s.organisations).where(eq(s.organisations.id, id)).limit(1);
  return o ?? null;
}
