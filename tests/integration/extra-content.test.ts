import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { addContentItem, contentRedirect, listContent, reorderContent } from "@/functions/extra-content/logic";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

async function content(eventOverrides = {}) {
  const org = await makeOrg();
  const ev = await makeEvent(org.id, eventOverrides);
  const f = await makeFunction(ev.id, { type: "extra_content", config: {}, gate: "code", accessCodeHash: "x" });
  const file = await addContentItem(f.id, { kind: "file", title: "Sermon audio", storageKey: `content/${org.id}/abc/sermon.mp3`, mime: "audio/mpeg", size: 1000 });
  const link = await addContentItem(f.id, { kind: "link", title: "Slides", url: "https://example.com/slides" });
  return { f, file, link };
}
const entitle = (userId: string, fid: string) => db.insert(s.entitlements).values({ userId, eventFunctionId: fid, source: "code" });

describe("extra content", () => {
  beforeEach(resetDb);

  it("locked viewers see titles only", async () => {
    const { f } = await content();
    const items = await listContent(f.id, (await makeUser()).id);
    expect(items.map((i) => [i.title, i.locked, i.url])).toEqual([
      ["Sermon audio", true, undefined],
      ["Slides", true, undefined],
    ]);
  });

  it("entitled viewers get links", async () => {
    const { f, file } = await content();
    const u = await makeUser();
    await entitle(u.id, f.id);
    const items = await listContent(f.id, u.id);
    expect(items[0]).toMatchObject({ locked: false, url: `/api/content/${file.id}` });
    expect(items[1]).toMatchObject({ locked: false, url: "https://example.com/slides" });
  });

  it("file downloads need an entitlement and expire in an hour", async () => {
    const { f, file } = await content();
    const u = await makeUser();
    expect(await contentRedirect(file.id, u.id)).toEqual({ status: 403 });
    expect(await contentRedirect(file.id, null)).toEqual({ status: 403 });
    await entitle(u.id, f.id);
    const r = await contentRedirect(file.id, u.id);
    expect(r.status).toBe(302);
    expect(r.status === 302 && r.location).toContain("X-Amz-Expires=3600");
  });

  it("still serves content after the event ends", async () => {
    const { f, file } = await content({ status: "ended" });
    const u = await makeUser();
    await entitle(u.id, f.id);
    expect((await contentRedirect(file.id, u.id)).status).toBe(302);
  });

  it("links must be http(s)", async () => {
    const { f } = await content();
    await expect(addContentItem(f.id, { kind: "link", title: "x", url: "javascript:alert(1)" })).rejects.toThrow();
  });

  it("rejects disallowed file types", async () => {
    const { f } = await content();
    await expect(
      addContentItem(f.id, { kind: "file", title: "x", storageKey: `content/${(await makeOrg()).id}/a/x.exe`, mime: "application/octet-stream", size: 10 }),
    ).rejects.toThrow();
  });

  it("reorders items", async () => {
    const { f, file, link } = await content();
    await reorderContent(f.id, [link.id, file.id]);
    expect((await listContent(f.id, null)).map((i) => i.title)).toEqual(["Slides", "Sermon audio"]);
  });
});
