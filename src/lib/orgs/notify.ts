import { Text } from "@react-email/components";
import { eq } from "drizzle-orm";
import { createElement } from "react";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/send";
import { EmailLayout } from "@/lib/email/templates/Layout";

/** Fire-and-forget email to an organisation's owners. Never throws. */
export function notifyOwners(organisationId: string, subject: string, body: string): void {
  void (async () => {
    const owners = await db
      .select({ email: s.user.email })
      .from(s.memberships)
      .innerJoin(s.user, eq(s.user.id, s.memberships.userId))
      .where(eq(s.memberships.organisationId, organisationId));
    const react = createElement(EmailLayout, { preview: subject, children: createElement(Text, null, body) });
    await Promise.all(owners.map((o) => sendEmail({ to: o.email, subject, react })));
  })().catch((err) => console.error("[notifyOwners]", err));
}
