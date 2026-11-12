import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getMyOrganisations, type Org } from "./service";

/** v1: an organiser has one organisation. Sends them to onboarding if they have none. */
export async function requireCurrentOrg(): Promise<{ user: Awaited<ReturnType<typeof requireUser>>; org: Org }> {
  const user = await requireUser();
  const [org] = await getMyOrganisations(user.id);
  if (!org) redirect("/dashboard/onboarding");
  return { user, org };
}
