import { and, asc, eq } from "drizzle-orm";
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
  claims: { number: number; name: string; email: string; status: "held" | "confirmed"; calledAt: Date | null }[];
  called: number | null;
  min: number;
  max: number;
};

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
    .innerJoin(s.user, eq(s.user.id, s.numberClaims.userId))
    .where(eq(s.numberClaims.eventFunctionId, functionId))
    .orderBy(asc(s.numberClaims.number));
  const now = Date.now();
  const { called, min, max } = await getPickerState(functionId, null);
  return {
    claims: rows
      .filter((r) => r.status === "confirmed" || (r.holdExpiresAt && r.holdExpiresAt.getTime() > now))
      .map(({ holdExpiresAt: _, ...r }) => r),
    called,
    min,
    max,
  };
}
