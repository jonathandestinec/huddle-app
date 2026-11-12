"use server";
import { requireUser } from "@/lib/auth/session";
import { UserError, toActionResult } from "@/lib/errors";
import { createUploadUrl, type UploadPrefix } from "./index";

export async function createUploadUrlAction(input: { prefix: UploadPrefix; filename: string; mime: string; size: number }) {
  return toActionResult(async () => {
    await requireUser();
    try {
      return await createUploadUrl(input);
    } catch (err) {
      throw new UserError((err as Error).message);
    }
  });
}
