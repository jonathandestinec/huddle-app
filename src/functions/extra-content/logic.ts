import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { UserError } from "@/lib/errors";
import { hasEntitlement } from "@/lib/gating/access";
import { signedReadUrl, validateUpload } from "@/lib/storage";

const itemInput = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("file"),
    title: z.string().trim().min(1).max(120),
    storageKey: z.string().startsWith("content/"),
    mime: z.string(),
    size: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("link"),
    title: z.string().trim().min(1).max(120),
    url: z.string().trim().regex(/^https?:\/\//, "Links must start with http:// or https://"),
  }),
]);

export type ContentItemInput = z.input<typeof itemInput>;

export async function addContentItem(functionId: string, raw: ContentItemInput): Promise<{ id: string }> {
  const input = itemInput.parse(raw);
  if (input.kind === "file") {
    try {
      validateUpload({ filename: input.storageKey, mime: input.mime, size: input.size });
    } catch (e) {
      throw new UserError((e as Error).message);
    }
  }
  const [{ n }] = await db.select({ n: count() }).from(s.contentItems).where(eq(s.contentItems.eventFunctionId, functionId));
  const [row] = await db
    .insert(s.contentItems)
    .values(
      input.kind === "file"
        ? { eventFunctionId: functionId, kind: "file", title: input.title, storageKey: input.storageKey, mimeType: input.mime, sizeBytes: input.size, position: n }
        : { eventFunctionId: functionId, kind: "link", title: input.title, url: input.url, position: n },
    )
    .returning({ id: s.contentItems.id });
  return row;
}

export async function removeContentItem(itemId: string): Promise<void> {
  await db.delete(s.contentItems).where(eq(s.contentItems.id, itemId));
}

export async function reorderContent(functionId: string, ids: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (const [i, id] of ids.entries()) {
      await tx
        .update(s.contentItems)
        .set({ position: i })
        .where(and(eq(s.contentItems.id, id), eq(s.contentItems.eventFunctionId, functionId)));
    }
  });
}

export type ContentListItem = { id: string; title: string; kind: "file" | "link"; mime: string | null; locked: boolean; url?: string };

export async function listContent(functionId: string, viewerId: string | null): Promise<ContentListItem[]> {
  const rows = await db.select().from(s.contentItems).where(eq(s.contentItems.eventFunctionId, functionId)).orderBy(asc(s.contentItems.position));
  const unlocked = viewerId ? await hasEntitlement(viewerId, functionId) : false;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    mime: r.mimeType,
    locked: !unlocked,
    url: unlocked ? (r.kind === "file" ? `/api/content/${r.id}` : r.url!) : undefined,
  }));
}

/** Decides what GET /api/content/[itemId] returns. */
export async function contentRedirect(itemId: string, viewerId: string | null): Promise<{ status: 302; location: string } | { status: 403 | 404 }> {
  const [item] = await db.select().from(s.contentItems).where(eq(s.contentItems.id, itemId)).limit(1);
  if (!item || item.kind !== "file" || !item.storageKey) return { status: 404 };
  if (!viewerId || !(await hasEntitlement(viewerId, item.eventFunctionId))) return { status: 403 };
  return { status: 302, location: await signedReadUrl(item.storageKey, 3600) };
}

export async function listContentForOwner(functionId: string) {
  return db.select().from(s.contentItems).where(eq(s.contentItems.eventFunctionId, functionId)).orderBy(asc(s.contentItems.position));
}
