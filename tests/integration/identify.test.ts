import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn(async () => {}) }));

import { identifyAttendee } from "@/lib/auth/identify";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/send";
import { makeUser, resetDb } from "./setup";

const headers = () => new Headers({ origin: "http://localhost:3000" });

describe("identifyAttendee", () => {
  beforeEach(async () => {
    await resetDb();
    vi.mocked(sendEmail).mockClear();
  });

  it("signs in a brand-new email immediately", async () => {
    const result = await identifyAttendee(
      { name: "Grace Eze", email: "grace@example.com", callbackPath: "/wc/sunday" },
      headers(),
    );
    expect(result.status).toBe("signed_in");
    const [u] = await db.select().from(s.user).where(eq(s.user.email, "grace@example.com"));
    expect(u).toBeDefined();
    expect(u.emailVerified).toBe(false);
    const sessions = await db.select().from(s.session).where(eq(s.session.userId, u.id));
    expect(sessions).toHaveLength(1);
    expect(result.status === "signed_in" && result.setCookie).toMatch(/session_token=/);
  });

  it("sends a magic link instead of signing in an existing email", async () => {
    const existing = await makeUser({ email: "ada@example.com" });
    const result = await identifyAttendee(
      { name: "Someone Else", email: "ada@example.com", callbackPath: "/wc/sunday" },
      headers(),
    );
    expect(result.status).toBe("check_email");
    const sessions = await db.select().from(s.session).where(eq(s.session.userId, existing.id));
    expect(sessions).toHaveLength(0);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendEmail).mock.calls[0][0].to).toBe("ada@example.com");
  });

  it("normalises email before matching", async () => {
    await makeUser({ email: "ada@example.com" });
    const result = await identifyAttendee(
      { name: "Ada", email: "  Ada@Example.com ", callbackPath: "/wc/sunday" },
      headers(),
    );
    expect(result.status).toBe("check_email");
  });

  it("rejects an invalid email", async () => {
    await expect(
      identifyAttendee({ name: "Ada", email: "not-an-email", callbackPath: "/" }, headers()),
    ).rejects.toThrow();
  });
});
