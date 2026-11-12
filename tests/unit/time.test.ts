import { describe, expect, it } from "vitest";
import { formatEventTime, lagosLocalToUtc, utcToLagosLocal } from "@/lib/events/time";

describe("lagosLocalToUtc", () => {
  it("treats datetime-local input as Lagos time (UTC+1)", () => {
    expect(lagosLocalToUtc("2026-11-16T09:00").toISOString()).toBe("2026-11-16T08:00:00.000Z");
  });
  it("rejects malformed input", () => {
    expect(() => lagosLocalToUtc("16/11/2026 9am")).toThrow();
  });
});

describe("utcToLagosLocal", () => {
  it("round-trips for form defaults", () => {
    expect(utcToLagosLocal(new Date("2026-11-16T08:00:00Z"))).toBe("2026-11-16T09:00");
  });
});

describe("formatEventTime", () => {
  it("formats in Lagos time", () => {
    expect(formatEventTime(new Date("2026-11-16T08:00:00Z"))).toBe("Mon 16 Nov · 9:00 AM");
  });
});
