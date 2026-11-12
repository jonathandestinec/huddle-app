import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { assertOrgOwner } from "./permissions";
import { auth } from "./server";

export type SessionUser = { id: string; email: string; name: string; emailVerified: boolean };

export async function getSession(): Promise<{ user: SessionUser } | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const { id, email, name, emailVerified } = s.user;
  return { user: { id, email, name, emailVerified } };
}

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s.user;
}

export async function requireOrgOwner(organisationId: string): Promise<SessionUser> {
  const user = await requireUser();
  await assertOrgOwner(user.id, organisationId);
  return user;
}
