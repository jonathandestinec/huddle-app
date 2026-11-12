import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();
const emptyJson = sql`'{}'::jsonb`;

/* ── Better Auth tables (field names follow Better Auth's Drizzle adapter) ── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: ts("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: ts("access_token_expires_at"),
  refreshTokenExpiresAt: ts("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: ts("expires_at").notNull(),
  createdAt: createdAt(),
  updatedAt: ts("updated_at").notNull().defaultNow(),
});

/* ── Enums ── */

export const eventStatus = pgEnum("event_status", ["draft", "published", "ended"]);
export const functionType = pgEnum("function_type", ["rsvp", "number_picker", "extra_content"]);
export const gate = pgEnum("gate", ["free", "paid", "code"]);
export const entitlementSource = pgEnum("entitlement_source", ["free", "payment", "code"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "success", "failed", "abandoned"]);
export const claimStatus = pgEnum("claim_status", ["held", "confirmed"]);
export const contentKind = pgEnum("content_kind", ["file", "link"]);
export const memberRole = pgEnum("member_role", ["owner"]);

/* ── Huddle tables ── */

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoKey: text("logo_key"),
  paystackSubaccountCode: text("paystack_subaccount_code"),
  bankName: text("bank_name"),
  accountLast4: text("account_last4"),
  feeBps: integer("fee_bps").notNull().default(500),
  createdAt: createdAt(),
});

export const memberships = pgTable(
  "memberships",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("owner"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.organisationId] })],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    coverKey: text("cover_key"),
    startsAt: ts("starts_at").notNull(),
    endsAt: ts("ends_at"),
    venue: text("venue"),
    meetingUrl: text("meeting_url"),
    status: eventStatus("status").notNull().default("draft"),
    createdAt: createdAt(),
  },
  (t) => [unique("events_org_slug").on(t.organisationId, t.slug)],
);

export const eventFunctions = pgTable(
  "event_functions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    type: functionType("type").notNull(),
    gate: gate("gate").notNull().default("free"),
    priceKobo: integer("price_kobo"),
    accessCodeHash: text("access_code_hash"),
    config: jsonb("config").notNull().default(emptyJson),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [unique("event_functions_event_type").on(t.eventId, t.type)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    eventFunctionId: uuid("event_function_id")
      .notNull()
      .references(() => eventFunctions.id),
    paystackReference: text("paystack_reference").notNull().unique(),
    amountKobo: integer("amount_kobo").notNull(),
    huddleFeeKobo: integer("huddle_fee_kobo").notNull(),
    status: paymentStatus("status").notNull().default("pending"),
    metadata: jsonb("metadata").notNull().default(emptyJson),
    createdAt: createdAt(),
    settledAt: ts("settled_at"),
  },
  (t) => [index("payments_function_idx").on(t.eventFunctionId)],
);

export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventFunctionId: uuid("event_function_id")
      .notNull()
      .references(() => eventFunctions.id),
    source: entitlementSource("source").notNull(),
    paymentId: uuid("payment_id").references(() => payments.id),
    createdAt: createdAt(),
  },
  (t) => [unique("entitlements_user_function").on(t.userId, t.eventFunctionId)],
);

export const numberClaims = pgTable(
  "number_claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventFunctionId: uuid("event_function_id")
      .notNull()
      .references(() => eventFunctions.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: claimStatus("status").notNull(),
    holdExpiresAt: ts("hold_expires_at"),
    calledAt: ts("called_at"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("number_claims_function_number").on(t.eventFunctionId, t.number),
    unique("number_claims_function_user").on(t.eventFunctionId, t.userId),
  ],
);

export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventFunctionId: uuid("event_function_id")
      .notNull()
      .references(() => eventFunctions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [unique("rsvps_function_user").on(t.eventFunctionId, t.userId)],
);

export const contentItems = pgTable("content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventFunctionId: uuid("event_function_id")
    .notNull()
    .references(() => eventFunctions.id, { onDelete: "cascade" }),
  kind: contentKind("kind").notNull(),
  title: text("title").notNull(),
  storageKey: text("storage_key"),
  url: text("url"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  position: integer("position").notNull().default(0),
});

/** Generic sliding-window rate limit events (identify, access codes). */
export const rateEvents = pgTable(
  "rate_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    at: ts("at").notNull().defaultNow(),
  },
  (t) => [index("rate_events_key_at").on(t.key, t.at)],
);

export const codeAttempts = pgTable(
  "code_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventFunctionId: uuid("event_function_id")
      .notNull()
      .references(() => eventFunctions.id, { onDelete: "cascade" }),
    ipHash: text("ip_hash").notNull(),
    attemptedAt: ts("attempted_at").notNull().defaultNow(),
  },
  (t) => [index("code_attempts_lookup").on(t.eventFunctionId, t.ipHash, t.attemptedAt)],
);
