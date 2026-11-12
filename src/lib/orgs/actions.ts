"use server";
import { requireUser } from "@/lib/auth/session";
import { toActionResult } from "@/lib/errors";
import { createOrganisation, isSlugAvailable } from "./service";

export async function createOrganisationAction(input: { name: string; slug: string; logoKey?: string }) {
  return toActionResult(async () => {
    const user = await requireUser();
    return createOrganisation(user.id, input);
  });
}

export async function checkSlugAction(slug: string): Promise<boolean> {
  await requireUser();
  return isSlugAvailable(slug);
}
