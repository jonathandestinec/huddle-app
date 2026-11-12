import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { auth } from "./server";

const input = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  callbackPath: z.string().startsWith("/"),
});

export type IdentifyResult = { status: "signed_in"; setCookie?: string } | { status: "check_email" };

/**
 * Attendee "who are you?" step. New email → signed in on the spot.
 * Known email → magic link only, so nobody can borrow someone else's purchases by typing their email.
 */
export async function identifyAttendee(raw: z.input<typeof input>, headers: Headers): Promise<IdentifyResult> {
  const { name, email, callbackPath } = input.parse(raw);

  const [existing] = await db.select({ id: s.user.id }).from(s.user).where(eq(s.user.email, email)).limit(1);
  if (existing) {
    await auth.api.signInMagicLink({ body: { email, callbackURL: callbackPath }, headers });
    return { status: "check_email" };
  }

  try {
    const res = await auth.api.attendeeIdentify({ body: { name, email }, headers, returnHeaders: true });
    return { status: "signed_in", setCookie: res.headers.get("set-cookie") ?? undefined };
  } catch (err) {
    // Lost a race with another request creating the same email: treat as existing.
    if (err instanceof Error && err.message.includes("EMAIL_EXISTS")) {
      await auth.api.signInMagicLink({ body: { email, callbackURL: callbackPath }, headers });
      return { status: "check_email" };
    }
    throw err;
  }
}
