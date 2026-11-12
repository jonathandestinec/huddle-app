import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";

const APP_TABLES = [
  "code_attempts",
  "content_items",
  "rsvps",
  "number_claims",
  "payments",
  "entitlements",
  "event_functions",
  "events",
  "memberships",
  "organisations",
  "verification",
  "account",
  "session",
  '"user"',
];

export async function resetDb() {
  await db.execute(sql.raw(`TRUNCATE ${APP_TABLES.join(", ")} CASCADE`));
}

export async function makeUser(overrides: Partial<typeof s.user.$inferInsert> = {}) {
  const id = randomUUID();
  const [u] = await db
    .insert(s.user)
    .values({ id, name: "Ada Obi", email: `${id}@example.com`, emailVerified: true, ...overrides })
    .returning();
  return u;
}

export async function makeOrg(overrides: Partial<typeof s.organisations.$inferInsert> = {}) {
  const slug = `org-${randomUUID().slice(0, 8)}`;
  const [o] = await db
    .insert(s.organisations)
    .values({ name: "Watchers Channel", slug, ...overrides })
    .returning();
  return o;
}

export async function makeEvent(organisationId: string, overrides: Partial<typeof s.events.$inferInsert> = {}) {
  const [e] = await db
    .insert(s.events)
    .values({
      organisationId,
      slug: `ev-${randomUUID().slice(0, 8)}`,
      title: "Sunday Service",
      startsAt: new Date("2026-11-16T08:00:00Z"),
      status: "published",
      ...overrides,
    })
    .returning();
  return e;
}

export async function makeFunction(eventId: string, overrides: Partial<typeof s.eventFunctions.$inferInsert> = {}) {
  const [f] = await db
    .insert(s.eventFunctions)
    .values({ eventId, type: "number_picker", gate: "free", config: { min: 1, max: 100 }, ...overrides })
    .returning();
  return f;
}
