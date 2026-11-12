import { and, asc, eq, isNull } from "drizzle-orm";
import { assertOrgOwner } from "@/lib/auth/permissions";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { UserError } from "@/lib/errors";
import { getFunctionWithEvent } from "@/lib/functions/service";
import { getPickerState } from "./logic";

async function ownPicker(userId: string, functionId: string) {
  const info = await getFunctionWithEvent(functionId);
  if (!info || info.fn.type !== "number_picker") throw new UserError("Number Picker not found");
  await assertOrgOwner(userId, info.org.id);
  return info;
}

export async function callNumber(userId: string, functionId: string, n: number): Promise<void> {
  await ownPicker(userId, functionId);
  const updated = await db
    .update(s.numberClaims)
    .set({ calledAt: new Date() })
    .where(and(eq(s.numberClaims.eventFunctionId, functionId), eq(s.numberClaims.number, n), eq(s.numberClaims.status, "confirmed")))
    .returning({ id: s.numberClaims.id });
  if (!updated.length) throw new UserError(`Nobody holds #${n} yet`);
}

export async function uncallNumber(userId: string, functionId: string, n: number): Promise<void> {
  await ownPicker(userId, functionId);
  await db
    .update(s.numberClaims)
    .set({ calledAt: null })
    .where(and(eq(s.numberClaims.eventFunctionId, functionId), eq(s.numberClaims.number, n)));
}

export type HostState = {
  /** name/email are null for anonymous picks. */
  claims: { number: number; name: string | null; email: string | null; status: "held" | "confirmed"; calledAt: Date | null }[];
  called: number | null;
  min: number;
  max: number;
  anonymous: boolean;
};

/** Calls the lowest picked number that hasn't been called yet. Returns it, or null when everyone's been called. */
export async function callNextNumber(userId: string, functionId: string): Promise<number | null> {
  await ownPicker(userId, functionId);
  const [next] = await db
    .select({ number: s.numberClaims.number })
    .from(s.numberClaims)
    .where(and(eq(s.numberClaims.eventFunctionId, functionId), eq(s.numberClaims.status, "confirmed"), isNull(s.numberClaims.calledAt)))
    .orderBy(asc(s.numberClaims.number))
    .limit(1);
  if (!next) return null;
  await callNumber(userId, functionId, next.number);
  return next.number;
}

export async function getHostState(userId: string, functionId: string): Promise<HostState> {
  await ownPicker(userId, functionId);
  const rows = await db
    .select({
      number: s.numberClaims.number,
      name: s.user.name,
      email: s.user.email,
      status: s.numberClaims.status,
      calledAt: s.numberClaims.calledAt,
      holdExpiresAt: s.numberClaims.holdExpiresAt,
    })
    .from(s.numberClaims)
    .leftJoin(s.user, eq(s.user.id, s.numberClaims.userId))
    .where(eq(s.numberClaims.eventFunctionId, functionId))
    .orderBy(asc(s.numberClaims.number));
  const now = Date.now();
  const { called, min, max, anonymous } = await getPickerState(functionId, null);
  return {
    anonymous,
    claims: rows
      .filter((r) => r.status === "confirmed" || (r.holdExpiresAt && r.holdExpiresAt.getTime() > now))
      .map(({ holdExpiresAt: _, ...r }) => r),
    called,
    min,
    max,
  };
}
