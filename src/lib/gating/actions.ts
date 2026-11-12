"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { UserError, toActionResult } from "@/lib/errors";
import { startPaidUnlock } from "@/lib/payments/start";
import { unlockFree, unlockWithCode } from "./access";

async function viewer() {
  const s = await getSession();
  if (!s) throw new UserError("Tell us who you are first");
  return s.user;
}

async function ipHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}:${getEnv().BETTER_AUTH_SECRET}`).digest("hex");
}

export async function unlockFreeAction(functionId: string) {
  return toActionResult(async () => {
    const u = await viewer();
    await unlockFree(u.id, functionId);
  });
}

export async function unlockWithCodeAction(functionId: string, code: string) {
  return toActionResult(async () => {
    const u = await viewer();
    const r = await unlockWithCode(u.id, functionId, code, await ipHash());
    if (!r.ok) throw new UserError(r.error);
  });
}

/** Metadata is never taken from the client — only claimNumber builds payment metadata server-side. */
export async function startPaidUnlockAction(functionId: string) {
  return toActionResult(async () => {
    const u = await viewer();
    return startPaidUnlock(u.id, functionId, {});
  });
}
