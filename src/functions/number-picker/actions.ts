"use server";
import { getSession } from "@/lib/auth/session";
import { getDeviceHash, getIpHash } from "@/lib/device";
import { UserError, toActionResult } from "@/lib/errors";
import { claimAnonymous, claimNumber } from "./logic";
import { releaseMyHold } from "./release";

export async function claimNumberAction(functionId: string, n: number) {
  return toActionResult(async () => {
    const s = await getSession();
    if (!s) throw new UserError("Tell us who you are first");
    const r = await claimNumber(s.user.id, functionId, n);
    if (!r.ok) throw new UserError(r.error);
    return r;
  });
}

/** Back on the page without having paid: free up their held number. */
export async function releaseMyHoldAction(functionId: string) {
  return toActionResult(async () => {
    const s = await getSession();
    if (!s) return { status: "none" as const };
    return releaseMyHold(s.user.id, functionId);
  });
}

/** Anonymous pickers: no sign-in. One number per phone. */
export async function claimAnonymousAction(functionId: string, n: number, code?: string) {
  return toActionResult(async () => {
    const deviceHash = (await getDeviceHash({ create: true }))!;
    const r = await claimAnonymous(functionId, n, { deviceHash, ipHash: await getIpHash(), code });
    if (!r.ok) throw new UserError(r.error);
    return r;
  });
}
