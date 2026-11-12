"use server";
import { revalidatePath } from "next/cache";
import { requireOrgOwner } from "@/lib/auth/session";
import { UserError, toActionResult } from "@/lib/errors";
import { requireCurrentOrg } from "@/lib/orgs/current";
import { createEvent, endEvent, getEventById, publishEvent, updateEvent, type EventInput } from "./service";

async function ownEvent(eventId: string) {
  const ev = await getEventById(eventId);
  if (!ev) throw new UserError("Event not found");
  await requireOrgOwner(ev.organisationId);
  return ev;
}

export async function createEventAction(input: EventInput) {
  return toActionResult(async () => {
    const { org } = await requireCurrentOrg();
    return createEvent(org.id, input);
  });
}

export async function updateEventAction(eventId: string, input: EventInput) {
  return toActionResult(async () => {
    await ownEvent(eventId);
    await updateEvent(eventId, input);
    revalidatePath(`/dashboard/events/${eventId}`);
  });
}

export async function publishEventAction(eventId: string) {
  return toActionResult(async () => {
    await ownEvent(eventId);
    await publishEvent(eventId);
    revalidatePath(`/dashboard/events/${eventId}`);
  });
}

export async function endEventAction(eventId: string) {
  return toActionResult(async () => {
    await ownEvent(eventId);
    await endEvent(eventId);
    revalidatePath(`/dashboard/events/${eventId}`);
  });
}
