import { config } from "dotenv";
import { vi } from "vitest";

config({ path: ".env.test" });

// No test ever talks to Resend. Tests that assert on email re-mock this module themselves.
vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn(async () => {}) }));
