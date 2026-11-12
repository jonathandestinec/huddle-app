import bcrypt from "bcryptjs";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as s from "@/lib/db/schema";
import { UserError, isUniqueViolation } from "@/lib/errors";
import { nairaToKobo } from "@/lib/money";
import { getFunctionDefinition } from "@/functions/registry";
import type { FunctionType, Gate } from "@/functions/types";

export const MIN_PRICE_KOBO = 10000;

type GateInput = { gate: Gate; priceNaira?: string; accessCode?: string };

async function gateColumns(organisationId: string, input: GateInput, existingHash?: string | null) {
  if (input.gate === "paid") {
    const [org] = await db
      .select({ sub: s.organisations.paystackSubaccountCode })
      .from(s.organisations)
      .where(eq(s.organisations.id, organisationId));
    if (!org?.sub) throw new UserError("Link a bank account to charge for this");
    let price: number;
    try {
      price = nairaToKobo(input.priceNaira ?? "");
    } catch (e) {
      throw new UserError((e as Error).message);
    }
    if (price < MIN_PRICE_KOBO) throw new UserError("The lowest price is ₦100");
    return { gate: "paid" as const, priceKobo: price, accessCodeHash: null };
  }
  if (input.gate === "code") {
    const code = input.accessCode?.trim();
    if (!code) {
      if (existingHash) return { gate: "code" as const, priceKobo: null, accessCodeHash: existingHash };
      throw new UserError("Access codes need at least 4 characters");
    }
    if (code.length < 4) throw new UserError("Access codes need at least 4 characters");
    return { gate: "code" as const, priceKobo: null, accessCodeHash: await bcrypt.hash(code, 10) };
  }
  return { gate: "free" as const, priceKobo: null, accessCodeHash: null };
}

function parseConfig(type: FunctionType, config: unknown) {
  const r = getFunctionDefinition(type).configSchema.safeParse(config);
  if (!r.success) throw new UserError(r.error.issues[0]?.message ?? "Check the settings");
  return r.data;
}

/** Anonymous pickers collect no email, and Paystack needs one — so they can't be paid. */
function assertGateFitsConfig(type: FunctionType, gate: Gate, config: unknown) {
  if (type === "number_picker" && (config as { anonymous?: boolean }).anonymous && gate === "paid") {
    throw new UserError("Anonymous picking works with Free or Access code");
  }
}

async function loadFunction(functionId: string) {
  const [r] = await db
    .select({ fn: s.eventFunctions, organisationId: s.events.organisationId })
    .from(s.eventFunctions)
    .innerJoin(s.events, eq(s.events.id, s.eventFunctions.eventId))
    .where(eq(s.eventFunctions.id, functionId));
  if (!r) throw new UserError("Function not found");
  return r;
}

async function hasEntitlements(functionId: string) {
  const [r] = await db.select({ n: count() }).from(s.entitlements).where(eq(s.entitlements.eventFunctionId, functionId));
  return (r?.n ?? 0) > 0;
}

const LOCKED = "People already have access to this — you can't change how they got in";

export async function attachFunction(
  eventId: string,
  input: GateInput & { type: FunctionType; config: unknown },
): Promise<{ id: string }> {
  const [ev] = await db.select({ organisationId: s.events.organisationId }).from(s.events).where(eq(s.events.id, eventId));
  if (!ev) throw new UserError("Event not found");
  const config = parseConfig(input.type, input.config);
  assertGateFitsConfig(input.type, input.gate, config);
  const gate = await gateColumns(ev.organisationId, input);
  const [{ n }] = await db.select({ n: count() }).from(s.eventFunctions).where(eq(s.eventFunctions.eventId, eventId));
  try {
    const [row] = await db
      .insert(s.eventFunctions)
      .values({ eventId, type: input.type, config, position: n, ...gate })
      .returning({ id: s.eventFunctions.id });
    return row;
  } catch (err) {
    if (isUniqueViolation(err)) throw new UserError(`This event already has ${getFunctionDefinition(input.type).label}`);
    throw err;
  }
}

export async function updateFunction(
  functionId: string,
  patch: Partial<GateInput> & { config?: unknown },
): Promise<void> {
  const { fn, organisationId } = await loadFunction(functionId);
  const nextGate = patch.gate ?? fn.gate;
  if (nextGate !== fn.gate && (await hasEntitlements(functionId))) throw new UserError(LOCKED);
  assertGateFitsConfig(fn.type, nextGate, patch.config ?? fn.config);

  const set: Partial<typeof s.eventFunctions.$inferInsert> = {};
  if (patch.config !== undefined) set.config = parseConfig(fn.type, patch.config);
  if (patch.gate !== undefined || patch.priceNaira !== undefined || patch.accessCode !== undefined) {
    Object.assign(
      set,
      await gateColumns(organisationId, { gate: nextGate, priceNaira: patch.priceNaira, accessCode: patch.accessCode }, fn.accessCodeHash),
    );
  }
  if (Object.keys(set).length) await db.update(s.eventFunctions).set(set).where(eq(s.eventFunctions.id, functionId));
}

export async function removeFunction(functionId: string): Promise<void> {
  await loadFunction(functionId);
  if (await hasEntitlements(functionId)) throw new UserError(LOCKED);
  await db.delete(s.eventFunctions).where(eq(s.eventFunctions.id, functionId));
}

/** Attendees can't act on drafts at all, and can't start anything new (pay, claim, reserve) once an event has ended. */
export function assertEventOpen(event: { status: "draft" | "published" | "ended" }, opts: { allowEnded?: boolean } = {}) {
  if (event.status === "draft") throw new UserError("This event isn't open yet");
  if (event.status === "ended" && !opts.allowEnded) throw new UserError("This event has ended");
}

export async function getFunctionWithEvent(functionId: string) {
  const [r] = await db
    .select({ fn: s.eventFunctions, event: s.events, org: s.organisations })
    .from(s.eventFunctions)
    .innerJoin(s.events, eq(s.events.id, s.eventFunctions.eventId))
    .innerJoin(s.organisations, eq(s.organisations.id, s.events.organisationId))
    .where(eq(s.eventFunctions.id, functionId));
  return r ?? null;
}
