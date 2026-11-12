"use server";
import { ForbiddenError } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { UserError, toActionResult } from "@/lib/errors";
import { authorizeUpload } from "./authorize";
import { createUploadUrl, type UploadPrefix } from "./index";

export async function createUploadUrlAction(input: { prefix: UploadPrefix; filename: string; mime: string; size: number; functionId?: string }) {
  return toActionResult(async () => {
    const user = await requireUser();
    let scope: string;
    try {
      scope = await authorizeUpload(user, input);
    } catch (err) {
      if (err instanceof ForbiddenError) throw new UserError("You can't upload here");
      throw err;
    }
    try {
      return await createUploadUrl({ ...input, scope });
    } catch (err) {
      throw new UserError((err as Error).message);
    }
  });
}
