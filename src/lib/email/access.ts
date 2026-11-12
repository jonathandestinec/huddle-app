import { and, eq } from "drizzle-orm";
import { createElement } from "react";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { getEnv } from "@/lib/env";
import { formatEventTime } from "@/lib/events/time";
import { getFunctionWithEvent } from "@/lib/functions/service";
import { formatNaira } from "@/lib/money";
import { getFunctionDefinition } from "@/functions/registry";
import { sendEmail } from "./send";
import { AccessEmail } from "./templates/Access";

/** Confirmation / receipt after someone gets access. Fire-and-forget: never throws, never blocks. */
export function sendAccessEmail(userId: string, functionId: string, kind: "receipt" | "registered", amountKobo?: number): void {
  void (async () => {
    const info = await getFunctionWithEvent(functionId);
    const [u] = await db.select().from(s.user).where(eq(s.user.id, userId));
    if (!info || !u) return;
    const [claim] =
      info.fn.type === "number_picker"
        ? await db
            .select({ number: s.numberClaims.number })
            .from(s.numberClaims)
            .where(and(eq(s.numberClaims.eventFunctionId, functionId), eq(s.numberClaims.userId, userId), eq(s.numberClaims.status, "confirmed")))
        : [];
    const label = getFunctionDefinition(info.fn.type).label;
    const subject = claim
      ? `Your number is #${claim.number} — ${info.event.title}`
      : kind === "receipt"
        ? `Receipt: ${label} for ${info.event.title}`
        : `You're in: ${info.event.title}`;
    await sendEmail({
      to: u.email,
      subject,
      react: createElement(AccessEmail, {
        kind,
        name: u.name,
        eventTitle: info.event.title,
        orgName: info.org.name,
        when: formatEventTime(info.event.startsAt),
        functionLabel: label,
        number: claim?.number ?? null,
        amount: amountKobo != null ? formatNaira(amountKobo) : null,
        url: `${getEnv().APP_URL}/${info.org.slug}/${info.event.slug}`,
      }),
    });
  })().catch((err) => console.error("[sendAccessEmail]", err));
}
