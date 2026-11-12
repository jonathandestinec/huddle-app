import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { clientIp, consumeRateLimit } from "@/lib/ratelimit";
import { auth } from "./server";

const WINDOW = 10 * 60 * 1000;

const input = z.object({
  /** Optional: email-only pickers never ask. The account then gets a name from the email, seen only by its owner. */
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  // Same-site paths only: "/x" yes, "//evil.com" and "/\evil.com" no.
  callbackPath: z.string().regex(/^\/(?![/\\])/, "Invalid return path"),
});

export type IdentifyResult = { status: "signed_in"; setCookie?: string } | { status: "check_email" } | { status: "rate_limited" };

async function sendMagicLink(email: string, callbackPath: string, headers: Headers): Promise<IdentifyResult> {
  if (!(await consumeRateLimit([{ key: `magic:${email}`, limit: 3 }], WINDOW))) return { status: "rate_limited" };
  await auth.api.signInMagicLink({ body: { email, callbackURL: callbackPath }, headers });
  return { status: "check_email" };
}

/**
 * Attendee "who are you?" step. New email → signed in on the spot.
 * Known email → magic link only, so nobody can borrow someone else's purchases by typing their email.
 * Accounts made here stay unverified until the email is proven, and unverified accounts can't own organisations.
 */
export async function identifyAttendee(raw: z.input<typeof input>, headers: Headers): Promise<IdentifyResult> {
  const { name: given, email, callbackPath } = input.parse(raw);
  const name = given || email.split("@")[0];
  if (!(await consumeRateLimit([{ key: `identify-ip:${clientIp(headers)}`, limit: 10 }], WINDOW))) {
    return { status: "rate_limited" };
  }

  const [existing] = await db.select({ id: s.user.id }).from(s.user).where(eq(s.user.email, email)).limit(1);
  if (existing) return sendMagicLink(email, callbackPath, headers);

  try {
    const res = await auth.api.attendeeIdentify({ body: { name, email }, headers, returnHeaders: true });
    return { status: "signed_in", setCookie: res.headers.get("set-cookie") ?? undefined };
  } catch (err) {
    // Lost a race with another request creating the same email: treat as existing.
    if (err instanceof Error && err.message.includes("EMAIL_EXISTS")) return sendMagicLink(email, callbackPath, headers);
    throw err;
  }
}
