import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "@/lib/env";

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

export const ALLOWED_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  mov: "video/quicktime",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export type UploadPrefix = "logos" | "covers" | "content";

let client: S3Client | undefined;
function s3() {
  const env = getEnv();
  client ??= new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
  });
  return client;
}

function sanitise(filename: string) {
  const dot = filename.lastIndexOf(".");
  const base = filename.slice(0, dot).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "file";
  return `${base.slice(0, 60)}.${filename.slice(dot + 1).toLowerCase()}`;
}

export function validateUpload(input: { filename: string; mime: string; size: number }) {
  if (input.size > MAX_UPLOAD_BYTES) throw new Error("Files can be up to 500 MB");
  const ext = input.filename.split(".").pop()?.toLowerCase() ?? "";
  const expected = ALLOWED_TYPES[ext];
  if (!expected || expected !== input.mime) {
    throw new Error("That file type isn't supported. Use PDF, MP3, M4A, MP4, MOV, JPG or PNG.");
  }
}

export async function createUploadUrl(input: {
  prefix: UploadPrefix;
  filename: string;
  mime: string;
  size: number;
}): Promise<{ key: string; url: string }> {
  validateUpload(input);
  const key = `${input.prefix}/${randomUUID()}/${sanitise(input.filename)}`;
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key, ContentType: input.mime, ContentLength: input.size }),
    { expiresIn: 15 * 60 },
  );
  return { key, url };
}

export async function signedReadUrl(key: string, ttlSeconds = 3600): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: getEnv().S3_BUCKET, Key: key }), { expiresIn: ttlSeconds });
}

/** Logos and covers: long-lived signed read URL (24h). */
export function publicImageUrl(key: string): Promise<string> {
  return signedReadUrl(key, 24 * 60 * 60);
}
