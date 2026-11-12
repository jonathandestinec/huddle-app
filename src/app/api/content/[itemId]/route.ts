import { contentRedirect } from "@/functions/extra-content/logic";
import { getSession } from "@/lib/auth/session";

export async function GET(_req: Request, ctx: RouteContext<"/api/content/[itemId]">) {
  const { itemId } = await ctx.params;
  const session = await getSession();
  const r = await contentRedirect(itemId, session?.user.id ?? null);
  if (r.status === 302) return Response.redirect(r.location, 302);
  return new Response(r.status === 403 ? "Unlock this first" : "Not found", { status: r.status });
}
