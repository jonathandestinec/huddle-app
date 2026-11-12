import { eq } from "drizzle-orm";
import { ForbiddenError, assertOrgOwner } from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getFunctionWithEvent } from "@/lib/functions/service";
import type { UploadPrefix } from "./index";

/**
 * Decides whether this person may upload, and returns the key scope the upload lives under:
 *   logos   → u-<userId>        (org may not exist yet)
 *   covers  → <orgId>           (an org they own)
 *   content → <orgId>           (the org that owns the function)
 * Keys are later checked against that scope, so nobody can attach another org's files.
 */
export async function authorizeUpload(
  user: { id: string; emailVerified: boolean },
  input: { prefix: UploadPrefix | string; functionId?: string },
): Promise<string> {
  if (!user.emailVerified) throw new ForbiddenError();
  if (input.prefix === "logos") return `u-${user.id}`;
  if (input.prefix === "covers") {
    const [m] = await db.select({ org: s.memberships.organisationId }).from(s.memberships).where(eq(s.memberships.userId, user.id)).limit(1);
    if (!m) throw new ForbiddenError();
    await assertOrgOwner(user.id, m.org);
    return m.org;
  }
  if (input.prefix === "content" && input.functionId) {
    const info = await getFunctionWithEvent(input.functionId);
    if (!info || info.fn.type !== "extra_content") throw new ForbiddenError();
    await assertOrgOwner(user.id, info.org.id);
    return info.org.id;
  }
  throw new ForbiddenError();
}
