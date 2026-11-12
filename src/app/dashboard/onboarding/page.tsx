import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getMyOrganisations } from "@/lib/orgs/service";
import { CreateOrgForm } from "./CreateOrgForm";

export default async function OnboardingPage() {
  const user = await requireUser();
  if ((await getMyOrganisations(user.id)).length > 0) redirect("/dashboard/onboarding/bank");
  return (
    <div className="mx-auto max-w-md">
      <p className="text-sm font-semibold text-slate">Step 1 of 2</p>
      <h1 className="mt-2 font-serif text-4xl leading-tight">
        Create your organisation — <em>it takes 2 minutes.</em>
      </h1>
      <CreateOrgForm />
    </div>
  );
}
