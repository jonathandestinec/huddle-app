import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/paystack/client", async (orig) => ({
  ...(await orig<typeof import("@/lib/paystack/client")>()),
  initializeTransaction: vi.fn(async ({ reference }: { reference: string }) => ({ authorizationUrl: `https://checkout.paystack.com/${reference}` })),
  verifyTransaction: vi.fn(async (reference: string) => ({ status: "success", amountKobo: 100000, reference })),
}));

import { assertOrgOwner, ForbiddenError } from "@/lib/auth/permissions";
import { identifyAttendee } from "@/lib/auth/identify";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/send";
import { createEvent } from "@/lib/events/service";
import { addContentItem } from "@/functions/extra-content/logic";
import { claimNumber } from "@/functions/number-picker/logic";
import { unlockFree, unlockWithCode } from "@/lib/gating/access";
import { createOrganisation } from "@/lib/orgs/service";
import { initializeTransaction } from "@/lib/paystack/client";
import { settlePayment } from "@/lib/payments/settle";
import { startPaidUnlock } from "@/lib/payments/start";
import { authorizeUpload } from "@/lib/storage/authorize";
import { makeEvent, makeFunction, makeOrg, makeUser, resetDb } from "./setup";

const hdrs = (ip = "1.1.1.1") => new Headers({ origin: "http://localhost:3000", "x-forwarded-for": ip });

describe("C1: pre-hijack via attendee identify", () => {
  beforeEach(async () => {
    await resetDb();
    vi.mocked(sendEmail).mockClear();
  });

  it("proving the email by magic link revokes sessions created before verification", async () => {
    await identifyAttendee({ name: "Attacker", email: "victim@example.com", callbackPath: "/" }, hdrs());
    const [u] = await db.select().from(s.user).where(eq(s.user.email, "victim@example.com"));
    const [attackerSession] = await db.select().from(s.session).where(eq(s.session.userId, u.id));

    await auth.api.signInMagicLink({ body: { email: "victim@example.com", callbackURL: "/" }, headers: hdrs("2.2.2.2") });
    const url = (vi.mocked(sendEmail).mock.calls.at(-1)![0].react.props as { url: string }).url;
    const token = new URL(url).searchParams.get("token")!;
    await auth.api.magicLinkVerify({ query: { token, callbackURL: "/" }, headers: hdrs("2.2.2.2") }).catch(() => {});

    const sessions = await db.select().from(s.session).where(eq(s.session.userId, u.id));
    expect(sessions.map((x) => x.id)).not.toContain(attackerSession.id);
    expect(sessions).toHaveLength(1);
    const [after] = await db.select().from(s.user).where(eq(s.user.id, u.id));
    expect(after.emailVerified).toBe(true);
  });

  it("unverified users are never org owners", async () => {
    const [u, o] = [await makeUser({ emailVerified: false }), await makeOrg()];
    await db.insert(s.memberships).values({ userId: u.id, organisationId: o.id });
    await expect(assertOrgOwner(u.id, o.id)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("unverified users can't create organisations", async () => {
    const u = await makeUser({ emailVerified: false });
    await expect(createOrganisation(u.id, { name: "Evil", slug: "evil" })).rejects.toThrow();
  });

  it("rejects protocol-relative callback paths", async () => {
    await expect(identifyAttendee({ name: "A", email: "a@example.com", callbackPath: "//evil.com" }, hdrs())).rejects.toThrow();
  });
});

describe("I5: identify is rate limited", () => {
  beforeEach(resetDb);

  it("limits new identities per IP", async () => {
    const results = [];
    for (let i = 0; i < 11; i++) results.push(await identifyAttendee({ name: "x", email: `p${i}@example.com`, callbackPath: "/" }, hdrs("9.9.9.9")));
    expect(results.slice(0, 10).every((r) => r.status === "signed_in")).toBe(true);
    expect(results[10].status).toBe("rate_limited");
  });

  it("limits magic links per email", async () => {
    await makeUser({ email: "busy@example.com" });
    const statuses = [];
    for (let i = 0; i < 4; i++) statuses.push((await identifyAttendee({ name: "x", email: "busy@example.com", callbackPath: "/" }, hdrs(`3.3.3.${i}`))).status);
    expect(statuses).toEqual(["check_email", "check_email", "check_email", "rate_limited"]);
  });
});

describe("I4: access-code limit holds under concurrency", () => {
  beforeEach(resetDb);

  it("12 parallel wrong guesses from one IP: only 5 are checked", { timeout: 90_000 }, async () => {
    const ev = await makeEvent((await makeOrg()).id);
    const f = await makeFunction(ev.id, { type: "extra_content", config: {}, gate: "code", accessCodeHash: await bcrypt.hash("GRACE", 4) });
    const u = await makeUser();
    const results = await Promise.all(Array.from({ length: 12 }, () => unlockWithCode(u.id, f.id, "nope", "ipX")));
    expect(results.filter((r) => !r.ok && r.error === "That code didn't work")).toHaveLength(5);
  });

  it("also limits per person across IPs", async () => {
    const ev = await makeEvent((await makeOrg()).id);
    const f = await makeFunction(ev.id, { type: "extra_content", config: {}, gate: "code", accessCodeHash: await bcrypt.hash("GRACE", 4) });
    const u = await makeUser();
    for (let i = 0; i < 10; i++) await unlockWithCode(u.id, f.id, "nope", `ip${i}`);
    expect(await unlockWithCode(u.id, f.id, "GRACE", "fresh-ip")).toEqual({ ok: false, error: "Too many tries — wait a few minutes" });
  });
});

describe("I2/I3: number picker payments", () => {
  beforeEach(async () => {
    await resetDb();
    vi.mocked(initializeTransaction).mockClear();
  });

  async function paidPicker() {
    const org = await makeOrg({ paystackSubaccountCode: "ACCT_x" });
    const ev = await makeEvent(org.id);
    return makeFunction(ev.id, { type: "number_picker", config: { min: 1, max: 100 }, gate: "paid", priceKobo: 100000 });
  }

  it("re-picking reuses the same checkout instead of starting a second charge", async () => {
    const f = await paidPicker();
    const u = await makeUser();
    const first = await claimNumber(u.id, f.id, 42);
    const second = await claimNumber(u.id, f.id, 43);
    expect(second.ok && second.status === "held" && second.authorizationUrl).toBe(first.ok && first.status === "held" && first.authorizationUrl);
    expect(initializeTransaction).toHaveBeenCalledTimes(1);
    const pays = await db.select().from(s.payments).where(eq(s.payments.userId, u.id));
    expect(pays).toHaveLength(1);
    await settlePayment(pays[0].paystackReference, "webhook");
    const claims = await db.select().from(s.numberClaims).where(eq(s.numberClaims.userId, u.id));
    expect(claims).toMatchObject([{ number: 43, status: "confirmed" }]);
  });

  it("a payment that grants nothing new is flagged as a duplicate", async () => {
    const f = await paidPicker();
    const u = await makeUser();
    await db.insert(s.entitlements).values({ userId: u.id, eventFunctionId: f.id, source: "payment" });
    await db.insert(s.payments).values({ userId: u.id, eventFunctionId: f.id, paystackReference: "hud_dupe", amountKobo: 100000, huddleFeeKobo: 5000 });
    expect(await settlePayment("hud_dupe", "webhook")).toBe("settled");
    const [p] = await db.select().from(s.payments).where(eq(s.payments.paystackReference, "hud_dupe"));
    expect(p.metadata).toMatchObject({ duplicate: true });
  });

  it("settlement ignores claims on other functions and out-of-range numbers", async () => {
    const [a, b] = [await paidPicker(), await paidPicker()];
    const u = await makeUser();
    await claimNumber(u.id, b.id, 5); // held on B
    const [claimB] = await db.select().from(s.numberClaims).where(eq(s.numberClaims.eventFunctionId, b.id));
    await db.insert(s.payments).values({ userId: u.id, eventFunctionId: a.id, paystackReference: "hud_cross", amountKobo: 100000, huddleFeeKobo: 5000, metadata: { claimId: claimB.id, number: 9999 } });
    expect(await settlePayment("hud_cross", "webhook")).toBe("settled");
    const [stillHeld] = await db.select().from(s.numberClaims).where(eq(s.numberClaims.id, claimB.id));
    expect(stillHeld.status).toBe("held");
    expect(await db.select().from(s.numberClaims).where(eq(s.numberClaims.eventFunctionId, a.id))).toHaveLength(0);
  });
});

describe("I6/I7: uploads are scoped to their owner", () => {
  beforeEach(resetDb);

  it("attendees (unverified) can't get upload URLs", async () => {
    const u = await makeUser({ emailVerified: false });
    await expect(authorizeUpload(u, { prefix: "logos" })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("content uploads need ownership of the function and are namespaced by org", async () => {
    const [owner, stranger, org] = [await makeUser(), await makeUser(), await makeOrg()];
    await db.insert(s.memberships).values({ userId: owner.id, organisationId: org.id });
    const f = await makeFunction((await makeEvent(org.id)).id, { type: "extra_content", config: {} });
    expect(await authorizeUpload(owner, { prefix: "content", functionId: f.id })).toBe(org.id);
    await expect(authorizeUpload(stranger, { prefix: "content", functionId: f.id })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("refuses content keys from another org", async () => {
    const [orgA, orgB] = [await makeOrg(), await makeOrg()];
    const f = await makeFunction((await makeEvent(orgA.id)).id, { type: "extra_content", config: {} });
    await expect(
      addContentItem(f.id, { kind: "file", title: "x", storageKey: `content/${orgB.id}/abc/x.pdf`, mime: "application/pdf", size: 10 }),
    ).rejects.toThrow();
    await expect(
      addContentItem(f.id, { kind: "file", title: "x", storageKey: `content/${orgA.id}/abc/x.pdf`, mime: "application/pdf", size: 10 }),
    ).resolves.toBeDefined();
  });

  it("refuses cover and logo keys that aren't yours", async () => {
    const [orgA, orgB, u] = [await makeOrg(), await makeOrg(), await makeUser()];
    await expect(createEvent(orgA.id, { title: "x", startsAtLocal: "2026-12-01T09:00", coverKey: `covers/${orgB.id}/a/b.png` })).rejects.toThrow();
    await expect(createOrganisation(u.id, { name: "Mine", slug: "mine-org", logoKey: "logos/u-someone-else/a/b.png" })).rejects.toThrow();
  });
});

describe("events must be open", () => {
  beforeEach(resetDb);

  it("can't unlock functions on a draft event", async () => {
    const f = await makeFunction((await makeEvent((await makeOrg()).id, { status: "draft" })).id, { type: "extra_content", config: {} });
    await expect(unlockFree((await makeUser()).id, f.id)).rejects.toThrow("This event isn't open yet");
  });

  it("can't pay for anything on an ended event", async () => {
    const org = await makeOrg({ paystackSubaccountCode: "ACCT_x" });
    const f = await makeFunction((await makeEvent(org.id, { status: "ended" })).id, { type: "extra_content", config: {}, gate: "paid", priceKobo: 100000 });
    await expect(startPaidUnlock((await makeUser()).id, f.id, {})).rejects.toThrow("This event has ended");
  });

  it("claiming on a draft event is refused", async () => {
    const f = await makeFunction((await makeEvent((await makeOrg()).id, { status: "draft" })).id, { type: "number_picker", config: { min: 1, max: 10 } });
    expect(await claimNumber((await makeUser()).id, f.id, 3)).toEqual({ ok: false, error: "This event isn't open yet" });
  });
});

describe("#8: dev outbox never runs in production", () => {
  it("throws instead of logging magic links", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_DEV_OUTBOX", "1");
    const { sendEmail: real } = await vi.importActual<typeof import("@/lib/email/send")>("@/lib/email/send");
    const { createElement } = await import("react");
    await expect(real({ to: "a@b.co", subject: "x", react: createElement("p", null, "x") })).rejects.toThrow(/RESEND_API_KEY/);
    vi.unstubAllEnvs();
  });
});

void and;
