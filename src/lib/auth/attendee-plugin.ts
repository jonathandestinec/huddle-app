import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";

/**
 * POST /api/auth/attendee/identify
 * Creates an account + session for an email that has never been seen before.
 * Existing emails are refused (CONFLICT) — those must prove ownership via magic link.
 */
export const attendeePlugin = () =>
  ({
    id: "huddle-attendee",
    endpoints: {
      attendeeIdentify: createAuthEndpoint(
        "/attendee/identify",
        {
          method: "POST",
          body: z.object({ name: z.string().trim().min(1).max(100), email: z.email() }),
        },
        async (ctx) => {
          const email = ctx.body.email.trim().toLowerCase();
          const adapter = ctx.context.internalAdapter;
          if (await adapter.findUserByEmail(email)) {
            throw new APIError("CONFLICT", { message: "EMAIL_EXISTS" });
          }
          const user = await adapter.createUser(
            { email, name: ctx.body.name, emailVerified: false },
            { method: "huddle-attendee" },
          );
          const session = await adapter.createSession(user.id);
          await setSessionCookie(ctx, { session, user });
          return ctx.json({ ok: true });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
