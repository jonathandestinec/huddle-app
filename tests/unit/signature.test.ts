import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPaystackSignature } from "@/lib/paystack/signature";

const body = JSON.stringify({ event: "charge.success", data: { reference: "hud_1" } });
const sign = (b: string) => createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(b).digest("hex");

describe("verifyPaystackSignature", () => {
  it("accepts a valid signature", () => {
    expect(verifyPaystackSignature(body, sign(body))).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(verifyPaystackSignature(body.replace("hud_1", "hud_2"), sign(body))).toBe(false);
  });
  it("rejects a missing signature", () => {
    expect(verifyPaystackSignature(body, null)).toBe(false);
  });
  it("rejects a malformed signature without throwing", () => {
    expect(verifyPaystackSignature(body, "abc")).toBe(false);
  });
});
