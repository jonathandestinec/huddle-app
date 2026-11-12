import { describe, expect, it } from "vitest";
import { formatNaira, nairaToKobo } from "@/lib/money";

describe("nairaToKobo", () => {
  it("parses thousands separators", () => expect(nairaToKobo("2,000")).toBe(200000));
  it("parses decimals exactly", () => expect(nairaToKobo("1500.50")).toBe(150050));
  it("parses a ₦ prefix and spaces", () => expect(nairaToKobo(" ₦ 1,000 ")).toBe(100000));
  it("rejects three decimal places", () => expect(() => nairaToKobo("1.234")).toThrow());
  it("rejects words", () => expect(() => nairaToKobo("two thousand")).toThrow());
  it("rejects negatives", () => expect(() => nairaToKobo("-500")).toThrow());
});

describe("formatNaira", () => {
  it("formats whole naira without decimals", () => expect(formatNaira(200000)).toBe("₦2,000"));
  it("formats kobo with two decimals", () => expect(formatNaira(150050)).toBe("₦1,500.50"));
});
