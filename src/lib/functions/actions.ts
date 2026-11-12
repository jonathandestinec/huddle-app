"use server";
import { revalidatePath } from "next/cache";
import { requireOrgOwner } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { UserError, toActionResult } from "@/lib/errors";
import type { FunctionType, Gate } from "@/functions/types";
import { eq } from "drizzle-orm";
import { attachFunction, getFunctionWithEvent, removeFunction, updateFunction } from "./service";

async function ownEvent(eventId: string) {
  const [ev] = await db.select({ organisationId: s.events.organisationId }).from(s.events).where(eq(s.events.id, eventId));
  if (!ev) throw new UserError("Event not found");
  await requireOrgOwner(ev.organisationId);
}

export async function ownFunction(functionId: string) {
  const r = await getFunctionWithEvent(functionId);
  if (!r) throw new UserError("Function not found");
  await requireOrgOwner(r.org.id);
  return r;
}

type GateInput = { gate: Gate; priceNaira?: string; accessCode?: string };

export async function attachFunctionAction(eventId: string, input: GateInput & { type: FunctionType; config: unknown }) {
  return toActionResult(async () => {
    await ownEvent(eventId);
    const r = await attachFunction(eventId, input);
    revalidatePath(`/dashboard/events/${eventId}`);
    return r;
  });
}

export async function updateFunctionAction(functionId: string, patch: Partial<GateInput> & { config?: unknown }) {
  return toActionResult(async () => {
    const { event } = await ownFunction(functionId);
    await updateFunction(functionId, patch);
    revalidatePath(`/dashboard/events/${event.id}`);
  });
}

export async function removeFunctionAction(functionId: string) {
  return toActionResult(async () => {
    const { event } = await ownFunction(functionId);
    await removeFunction(functionId);
    revalidatePath(`/dashboard/events/${event.id}`);
  });
}
