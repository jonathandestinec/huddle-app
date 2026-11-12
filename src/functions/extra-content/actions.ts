"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { UserError, toActionResult } from "@/lib/errors";
import { ownFunction } from "@/lib/functions/actions";
import { addContentItem, removeContentItem, reorderContent, type ContentItemInput } from "./logic";

export async function addContentItemAction(functionId: string, input: ContentItemInput) {
  return toActionResult(async () => {
    const { event, fn } = await ownFunction(functionId);
    if (fn.type !== "extra_content") throw new UserError("Not an Extra Content function");
    await addContentItem(functionId, input);
    revalidatePath(`/dashboard/events/${event.id}`);
  });
}

export async function removeContentItemAction(itemId: string) {
  return toActionResult(async () => {
    const [item] = await db.select().from(s.contentItems).where(eq(s.contentItems.id, itemId));
    if (!item) throw new UserError("Item not found");
    const { event } = await ownFunction(item.eventFunctionId);
    await removeContentItem(itemId);
    revalidatePath(`/dashboard/events/${event.id}`);
  });
}

export async function reorderContentAction(functionId: string, ids: string[]) {
  return toActionResult(async () => {
    const { event } = await ownFunction(functionId);
    await reorderContent(functionId, ids);
    revalidatePath(`/dashboard/events/${event.id}`);
  });
}
