import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

describe("sendEmail without a Resend key", () => {
  it("records to the dev outbox instead of calling Resend", async () => {
    vi.stubEnv("RESEND_API_KEY", "REPLACE_ME");
    const { sendEmail, devOutbox } = await vi.importActual<typeof import("@/lib/email/send")>("@/lib/email/send");
    await sendEmail({ to: "ada@example.com", subject: "Your link to Huddle", react: createElement("a", { href: "http://localhost:3000/api/auth/magic-link/verify?token=abc" }, "x") });
    const last = devOutbox().at(-1)!;
    expect(last.to).toBe("ada@example.com");
    expect(last.links).toContain("http://localhost:3000/api/auth/magic-link/verify?token=abc");
    vi.unstubAllEnvs();
  });
});
