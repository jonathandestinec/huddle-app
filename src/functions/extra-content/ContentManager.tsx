"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { uploadFile } from "@/lib/storage/upload-client";
import { addContentItemAction, removeContentItemAction, reorderContentAction } from "./actions";

type Item = { id: string; title: string; kind: "file" | "link" };

export function ContentManager({ functionId, items }: { functionId: string; items: Item[] }) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(undefined);
    for (const file of Array.from(files)) {
      try {
        setProgress(0);
        const key = await uploadFile(file, "content", setProgress);
        const r = await addContentItemAction(functionId, {
          kind: "file",
          title: file.name.replace(/\.[^.]+$/, ""),
          storageKey: key,
          mime: file.type,
          size: file.size,
        });
        if (!r.ok) setError(r.error);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    setProgress(null);
    router.refresh();
  }

  function move(i: number, dir: -1 | 1) {
    const ids = items.map((x) => x.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    start(async () => void (await reorderContentAction(functionId, ids), router.refresh()));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">What&apos;s inside</p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={it.id} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm">
            <span>{it.kind === "file" ? "📄" : "🔗"}</span>
            <span className="flex-1 truncate">{it.title}</span>
            <button type="button" onClick={() => move(i, -1)} className="px-1 text-slate" aria-label="Move up">↑</button>
            <button type="button" onClick={() => move(i, 1)} className="px-1 text-slate" aria-label="Move down">↓</button>
            <button
              type="button"
              className="px-1 text-red-600"
              onClick={() => start(async () => void (await removeContentItemAction(it.id), router.refresh()))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <label
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void upload(e.dataTransfer.files);
        }}
        className={`block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center text-sm transition-colors ${drag ? "border-ink bg-huddle-yellow/30" : "border-ink/15"}`}
      >
        <input type="file" multiple className="hidden" accept=".pdf,.mp3,.m4a,.mp4,.mov,.jpg,.jpeg,.png" onChange={(e) => upload(e.target.files)} />
        {progress != null ? `Uploading… ${Math.round(progress * 100)}%` : "Drop files here or tap to upload (up to 500 MB)"}
      </label>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await addContentItemAction(functionId, { kind: "link", title: linkTitle, url: linkUrl });
            if (!r.ok) return setError(r.error);
            setLinkTitle("");
            setLinkUrl("");
            router.refresh();
          });
        }}
      >
        <Input placeholder="Link title" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} required />
        <Input placeholder="https://" type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} required />
        <Button type="submit" variant="secondary" disabled={pending}>
          Add link
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
