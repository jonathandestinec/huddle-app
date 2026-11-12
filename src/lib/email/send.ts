import type { ReactElement } from "react";
import { Resend } from "resend";
import { getEnv } from "@/lib/env";

let client: Resend | undefined;

export async function sendEmail(input: { to: string; subject: string; react: ReactElement }): Promise<void> {
  const env = getEnv();
  client ??= new Resend(env.RESEND_API_KEY);
  const { error } = await client.emails.send({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    react: input.react,
  });
  if (error) throw new Error(`Email to ${input.to} failed: ${error.message}`);
}
