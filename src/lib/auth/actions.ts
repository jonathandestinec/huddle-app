"use server";
import { headers } from "next/headers";
import { identifyAttendee, type IdentifyResult } from "./identify";

export async function identifyAttendeeAction(input: {
  name: string;
  email: string;
  callbackPath: string;
}): Promise<{ status: IdentifyResult["status"] } | { status: "error"; message: string }> {
  try {
    const r = await identifyAttendee(input, await headers());
    return { status: r.status };
  } catch {
    return { status: "error", message: "Check your name and email and try again." };
  }
}
