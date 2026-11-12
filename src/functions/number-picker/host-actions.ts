"use server";
import { requireUser } from "@/lib/auth/session";
import { toActionResult } from "@/lib/errors";
import { callNumber, uncallNumber } from "./host";

export async function callNumberAction(functionId: string, n: number) {
  return toActionResult(async () => callNumber((await requireUser()).id, functionId, n));
}

export async function uncallNumberAction(functionId: string, n: number) {
  return toActionResult(async () => uncallNumber((await requireUser()).id, functionId, n));
}
