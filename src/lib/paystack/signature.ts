import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", getEnv().PAYSTACK_SECRET_KEY).update(rawBody).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}
