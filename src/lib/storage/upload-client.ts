"use client";
import { createUploadUrlAction } from "./actions";
import type { UploadPrefix } from "./index";

/** Uploads straight to storage with a presigned PUT. Reports progress 0–1. Returns the storage key. */
export async function uploadFile(file: File, prefix: UploadPrefix, onProgress?: (p: number) => void): Promise<string> {
  const res = await createUploadUrlAction({ prefix, filename: file.name, mime: file.type, size: file.size });
  if (!res.ok) throw new Error(res.error);
  const { key, url } = res.data;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Try again?")));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(file);
  });
  return key;
}
