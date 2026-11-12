import { describe, expect, it } from "vitest";
import { huddleFeeKobo } from "@/lib/paystack/fees";

describe("huddleFeeKobo", () => {
  it("takes 5% of ₦2,000", () => {
    expect(huddleFeeKobo(200000, 500)).toBe(10000);
  });
  it("rounds up partial kobo", () => {
    expect(huddleFeeKobo(10001, 500)).toBe(501);
  });
  it("is zero for a zero fee", () => {
    expect(huddleFeeKobo(200000, 0)).toBe(0);
  });
});
