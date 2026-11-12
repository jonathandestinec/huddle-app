import { redirect } from "next/navigation";
import { requireCurrentOrg } from "@/lib/orgs/current";

export default async function DashboardHome() {
  await requireCurrentOrg();
  redirect("/dashboard/events");
}
