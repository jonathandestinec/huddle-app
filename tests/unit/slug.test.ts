import { describe, expect, it } from "vitest";
import { isReservedSlug, slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Watchers Channel!")).toBe("watchers-channel");
  });
  it("collapses symbols and trims hyphens", () => {
    expect(slugify("  St. Mary's -- Youth  ")).toBe("st-mary-s-youth");
  });
  it("caps length at 48", () => {
    expect(slugify("a".repeat(80))).toHaveLength(48);
  });
});

describe("isReservedSlug", () => {
  it.each(["dashboard", "me", "api", "login", "_next"])("%s is reserved", (s) => {
    expect(isReservedSlug(s)).toBe(true);
  });
  it("normal names are not reserved", () => {
    expect(isReservedSlug("watchers-channel")).toBe(false);
  });
});
