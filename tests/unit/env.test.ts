import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const full = {
  DATABASE_URL: "postgres://u:p@h/db",
  BETTER_AUTH_SECRET: "x".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "g",
  GOOGLE_CLIENT_SECRET: "gs",
  RESEND_API_KEY: "re_x",
  EMAIL_FROM: "Huddle <hello@example.com>",
  PAYSTACK_SECRET_KEY: "sk_test_x",
  PAYSTACK_PUBLIC_KEY: "pk_test_x",
  S3_ENDPOINT: "https://s3.example.com",
  S3_REGION: "auto",
  S3_BUCKET: "huddle",
  S3_ACCESS_KEY_ID: "a",
  S3_SECRET_ACCESS_KEY: "s",
  CRON_SECRET: "c",
  APP_URL: "http://localhost:3000",
};

describe("parseEnv", () => {
  it("returns all keys when present", () => {
    expect(parseEnv(full)).toEqual(full);
  });

  it("names the missing key", () => {
    const { PAYSTACK_SECRET_KEY: _, ...rest } = full;
    expect(() => parseEnv(rest)).toThrow(/PAYSTACK_SECRET_KEY/);
  });

  it("rejects APP_URL without protocol", () => {
    expect(() => parseEnv({ ...full, APP_URL: "huddle.app" })).toThrow(/APP_URL/);
  });
});
