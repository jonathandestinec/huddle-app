import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getEnv } from "@/lib/env";
import { clientIp } from "@/lib/ratelimit";

const COOKIE = "huddle_device";

const hash = (v: string) => createHash("sha256").update(`${v}:${getEnv().BETTER_AUTH_SECRET}`).digest("hex");

/**
 * A private, random id for this phone/browser (an httpOnly cookie), stored only as a hash.
 * Used for anonymous Number Picker so each phone gets one number without any account.
 * `create` may only be true inside a server action or route handler (where cookies can be set).
 */
export async function getDeviceHash(opts: { create?: boolean } = {}): Promise<string | null> {
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  if (!id && opts.create) {
    id = randomBytes(24).toString("hex");
    jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  }
  return id ? hash(id) : null;
}

export async function getIpHash(): Promise<string> {
  return hash(`ip:${clientIp(await headers())}`);
}
