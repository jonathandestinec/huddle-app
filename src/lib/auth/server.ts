import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { createElement } from "react";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/send";
import { MagicLinkEmail } from "@/lib/email/templates/MagicLink";
import { getEnv } from "@/lib/env";
import { attendeePlugin } from "./attendee-plugin";

const env = getEnv();

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  socialProviders: {
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
  },
  session: { expiresIn: 60 * 60 * 24 * 30 },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({ to: email, subject: "Your link to Huddle", react: createElement(MagicLinkEmail, { url }) });
      },
    }),
    attendeePlugin(),
    // Must be last. Lets auth.api calls in server actions set cookies. Needs a Next request scope,
    // so it is left out under Vitest.
    ...(process.env.VITEST ? [] : [nextCookies()]),
  ],
});

export type Auth = typeof auth;
