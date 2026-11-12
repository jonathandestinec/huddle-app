import { sweepExpiredHolds } from "@/functions/number-picker/logic";
import { getEnv } from "@/lib/env";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${getEnv().CRON_SECRET}`) {
    return new Response("unauthorized", { status: 401 });
  }
  const released = await sweepExpiredHolds();
  return Response.json({ released });
}
