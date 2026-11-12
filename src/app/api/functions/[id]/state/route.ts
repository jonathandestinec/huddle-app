import { getPickerState } from "@/functions/number-picker/logic";
import { getSession } from "@/lib/auth/session";
import { getFunctionWithEvent } from "@/lib/functions/service";

export async function GET(_req: Request, ctx: RouteContext<"/api/functions/[id]/state">) {
  const { id } = await ctx.params;
  const info = await getFunctionWithEvent(id).catch(() => null);
  if (!info || info.fn.type !== "number_picker" || info.event.status === "draft") {
    return new Response("not found", { status: 404 });
  }
  const session = await getSession();
  return Response.json(await getPickerState(id, session?.user.id ?? null), {
    headers: { "Cache-Control": "no-store" },
  });
}
