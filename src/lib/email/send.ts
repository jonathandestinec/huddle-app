import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { getEnv } from "@/lib/env";

let client: Resend | undefined;

type OutboxEntry = { to: string; subject: string; links: string[]; at: Date };
const g = globalThis as unknown as { __huddleOutbox?: OutboxEntry[] };

/** Emails captured while no real Resend key is configured (local dev / e2e). */
export function devOutbox(): OutboxEntry[] {
  return (g.__huddleOutbox ??= []);
}

export async function sendEmail(input: { to: string; subject: string; react: ReactElement }): Promise<void> {
  const env = getEnv();
  const html = await render(input.react);

  if (env.RESEND_API_KEY === "REPLACE_ME") {
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replaceAll("&amp;", "&"));
    devOutbox().push({ to: input.to, subject: input.subject, links, at: new Date() });
    console.info(`[dev email] to=${input.to} subject="${input.subject}"\n  ${links.join("\n  ")}`);
    return;
  }

  client ??= new Resend(env.RESEND_API_KEY);
  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html,
  });
  if (error) throw new Error(`Email to ${input.to} failed: ${error.message}`);
}
