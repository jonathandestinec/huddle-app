import { requireCurrentOrg } from "@/lib/orgs/current";
import { EventForm } from "../EventForm";

export default async function NewEventPage() {
  await requireCurrentOrg();
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-8 font-serif text-4xl">
        Start a <em>huddle</em>
      </h1>
      <EventForm />
    </div>
  );
}
