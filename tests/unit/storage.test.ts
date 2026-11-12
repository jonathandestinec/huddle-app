import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, createUploadUrl, signedReadUrl } from "@/lib/storage";

const ok = { prefix: "content" as const, filename: "Sermon Notes.pdf", mime: "application/pdf", size: 1024 };

describe("createUploadUrl", () => {
  it("rejects files over 500 MB", async () => {
    await expect(createUploadUrl({ ...ok, size: MAX_UPLOAD_BYTES + 1 })).rejects.toThrow(/500 MB/);
  });

  it("rejects disallowed extensions", async () => {
    await expect(createUploadUrl({ ...ok, filename: "virus.exe", mime: "application/octet-stream" })).rejects.toThrow(
      /type/i,
    );
  });

  it("rejects a mime type that disagrees with the extension", async () => {
    await expect(createUploadUrl({ ...ok, mime: "video/mp4" })).rejects.toThrow(/type/i);
  });

  it("builds a namespaced key with a random id and sanitised filename", async () => {
    const { key, url } = await createUploadUrl(ok);
    expect(key).toMatch(/^content\/[a-z0-9-]{10,}\/sermon-notes\.pdf$/);
    expect(url).toContain("X-Amz-Signature");
  });
});

describe("signedReadUrl", () => {
  it("expires after one hour by default", async () => {
    const url = await signedReadUrl("content/abc/file.pdf");
    expect(url).toContain("X-Amz-Expires=3600");
  });
});
