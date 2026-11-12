/** An error whose message is safe and friendly enough to show the person using Huddle. */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

export function isUniqueViolation(err: unknown): boolean {
  let e = err as { code?: string; cause?: unknown } | undefined;
  while (e) {
    if (e.code === "23505") return true;
    e = e.cause as typeof e;
  }
  return false;
}

/** Server-action result helper: friendly message for UserError, generic for anything else. */
export async function toActionResult<T>(fn: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof UserError) return { ok: false, error: err.message };
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    console.error(err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
