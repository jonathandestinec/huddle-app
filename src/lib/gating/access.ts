import bcrypt from "bcryptjs";
import { and, count, eq, gt } from "drizzle-orm";
import { db, type Executor, type Tx } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { sendAccessEmail } from "@/lib/email/access";
import { UserError } from "@/lib/errors";
import { getFunctionDefinition } from "@/functions/registry";
import type { EntitlementSource, Gate, Payment } from "@/functions/types";

export const CODE_ATTEMPT_LIMIT = 5;
export const CODE_WINDOW_MS = 10 * 60 * 1000;

export type Access = { state: "unlocked" | "locked"; gate: Gate; priceKobo: number | null };

async function loadFn(functionId: string, ex: Executor = db) {
  const [f] = await ex.select().from(s.eventFunctions).where(eq(s.eventFunctions.id, functionId)).limit(1);
  if (!f) throw new UserError("Function not found");
  return f;
}

export async function hasEntitlement(userId: string, functionId: string, ex: Executor = db): Promise<boolean> {
  const [e] = await ex
    .select({ id: s.entitlements.id })
    .from(s.entitlements)
    .where(and(eq(s.entitlements.userId, userId), eq(s.entitlements.eventFunctionId, functionId)))
    .limit(1);
  return !!e;
}

export async function getAccess(userId: string | null, functionId: string): Promise<Access> {
  const f = await loadFn(functionId);
  const unlocked = userId ? await hasEntitlement(userId, functionId) : false;
  return { state: unlocked ? "unlocked" : "locked", gate: f.gate, priceKobo: f.priceKobo };
}

/**
 * The ONLY way an entitlement is created. Idempotent per (user, function).
 * When a new entitlement is created, the function's onEntitled hook runs in the same transaction.
 */
export async function grantEntitlement(
  tx: Tx,
  input: { userId: string; functionId: string; source: EntitlementSource; payment?: Payment },
): Promise<{ created: boolean }> {
  // Serialise grants per function (hooks like RSVP capacity rely on it). NO KEY UPDATE avoids FK deadlocks.
  const [f] = await tx.select().from(s.eventFunctions).where(eq(s.eventFunctions.id, input.functionId)).for("no key update");
  if (!f) throw new UserError("Function not found");
  const inserted = await tx
    .insert(s.entitlements)
    .values({
      userId: input.userId,
      eventFunctionId: input.functionId,
      source: input.source,
      paymentId: input.payment?.id ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: s.entitlements.id });
  if (inserted.length === 0) return { created: false };

  await getFunctionDefinition(f.type).onEntitled?.({
    tx,
    userId: input.userId,
    functionId: input.functionId,
    source: input.source,
    payment: input.payment,
  });
  return { created: true };
}

export async function unlockFree(userId: string, functionId: string): Promise<{ created: boolean }> {
  const f = await loadFn(functionId);
  if (f.gate !== "free") throw new UserError("This one isn't free");
  const r = await db.transaction((tx) => grantEntitlement(tx, { userId, functionId, source: "free" }));
  if (r.created) sendAccessEmail(userId, functionId, "registered");
  return r;
}

export async function unlockWithCode(
  userId: string,
  functionId: string,
  code: string,
  ipHash: string,
): Promise<{ ok: true } | { ok: false; error: "That code didn't work" | "Too many tries — wait a few minutes" }> {
  const f = await loadFn(functionId);
  if (f.gate !== "code" || !f.accessCodeHash) return { ok: false, error: "That code didn't work" };

  const since = new Date(Date.now() - CODE_WINDOW_MS);
  const [{ n }] = await db
    .select({ n: count() })
    .from(s.codeAttempts)
    .where(and(eq(s.codeAttempts.eventFunctionId, functionId), eq(s.codeAttempts.ipHash, ipHash), gt(s.codeAttempts.attemptedAt, since)));
  if (n >= CODE_ATTEMPT_LIMIT) return { ok: false, error: "Too many tries — wait a few minutes" };

  if (!(await bcrypt.compare(code.trim(), f.accessCodeHash))) {
    await db.insert(s.codeAttempts).values({ eventFunctionId: functionId, ipHash });
    return { ok: false, error: "That code didn't work" };
  }
  const r = await db.transaction((tx) => grantEntitlement(tx, { userId, functionId, source: "code" }));
  if (r.created) sendAccessEmail(userId, functionId, "registered");
  return { ok: true };
}
