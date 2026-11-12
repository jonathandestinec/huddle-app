"use server";
import { getSession } from "@/lib/auth/session";
import { UserError, toActionResult } from "@/lib/errors";
import { claimNumber } from "./logic";

export async function claimNumberAction(functionId: string, n: number) {
  return toActionResult(async () => {
    const s = await getSession();
    if (!s) throw new UserError("Tell us who you are first");
    const r = await claimNumber(s.user.id, functionId, n);
    if (!r.ok) throw new UserError(r.error);
    return r;
  });
}
