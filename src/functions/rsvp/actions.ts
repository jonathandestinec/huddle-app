"use server";
import { getSession } from "@/lib/auth/session";
import { UserError, toActionResult } from "@/lib/errors";
import { reserveSeat } from "./logic";

export async function reserveSeatAction(functionId: string) {
  return toActionResult(async () => {
    const s = await getSession();
    if (!s) throw new UserError("Tell us who you are first");
    const r = await reserveSeat(s.user.id, functionId);
    if (!r.ok) throw new UserError(r.error);
  });
}
