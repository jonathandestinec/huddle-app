import { getHostState } from "@/functions/number-picker/host";
import { ForbiddenError } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";

export async function GET(_req: Request, ctx: RouteContext<"/api/functions/[id]/host-state">) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return new Response("unauthorized", { status: 401 });
  try {
    return Response.json(await getHostState(session.user.id, id), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof ForbiddenError) return new Response("forbidden", { status: 403 });
    return new Response("not found", { status: 404 });
  }
}
