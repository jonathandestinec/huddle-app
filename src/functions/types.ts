import type { ZodType } from "zod";
import type { Tx } from "@/lib/db/client";
import type * as s from "@/lib/db/schema";

export type FunctionType = (typeof s.functionType.enumValues)[number];
export type Gate = (typeof s.gate.enumValues)[number];
export type EntitlementSource = (typeof s.entitlementSource.enumValues)[number];
export type Payment = typeof s.payments.$inferSelect;
export type EventFunctionRow = typeof s.eventFunctions.$inferSelect;

export type EntitledContext = {
  tx: Tx;
  userId: string;
  functionId: string;
  source: EntitlementSource;
  payment?: Payment;
};

/**
 * Server half of a Function Store module: what it is, how it's configured,
 * and what happens when someone is let in. UI lives in functions/ui-registry.tsx.
 */
export interface FunctionDefinition<Config = unknown> {
  type: FunctionType;
  label: string;
  description: string;
  emoji: string;
  configSchema: ZodType<Config>;
  defaultConfig: Config;
  onEntitled?(ctx: EntitledContext): Promise<void>;
}
