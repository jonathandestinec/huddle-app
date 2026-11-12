import { devOutbox } from "@/lib/email/send";

/** Local/E2E only: the last email captured for an address. Never available in production. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" || process.env.EMAIL_DEV_OUTBOX !== "1") {
    return new Response("not found", { status: 404 });
  }
  const to = new URL(req.url).searchParams.get("to");
  const last = devOutbox().filter((e) => e.to === to).at(-1);
  return Response.json(last ?? null, { headers: { "Cache-Control": "no-store" } });
}
