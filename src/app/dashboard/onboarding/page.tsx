import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getMyOrganisations } from "@/lib/orgs/service";
import { CreateOrgForm } from "./CreateOrgForm";

export default async function OnboardingPage() {
  const user = await requireUser();
  if ((await getMyOrganisations(user.id)).length > 0) redirect("/dashboard/onboarding/bank");
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-4xl leading-tight">Create your organisation</h1>
      <p className="mt-2 text-slate">The first of two short steps. It takes about two minutes.</p>
      <CreateOrgForm />
    </div>
  );
}
