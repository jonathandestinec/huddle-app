"use server";
import { headers } from "next/headers";
import { identifyAttendee, type IdentifyResult } from "./identify";

export async function identifyAttendeeAction(input: {
  name?: string;
  email: string;
  callbackPath: string;
}): Promise<{ status: Exclude<IdentifyResult["status"], "rate_limited"> } | { status: "error"; message: string }> {
  try {
    const r = await identifyAttendee(input, await headers());
    if (r.status === "rate_limited") return { status: "error" as const, message: "Too many tries — wait a few minutes." };
    return { status: r.status };
  } catch {
    return { status: "error", message: "Check your name and email and try again." };
  }
}
