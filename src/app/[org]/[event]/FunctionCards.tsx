import type { SessionUser } from "@/lib/auth/session";
import type { Event, EventFunction } from "@/lib/events/service";

/** Placeholder — renders each function's AttendeeCard via the registry from Task 8. */
export function FunctionCards({ functions }: { functions: EventFunction[]; event: Event; orgSlug: string; viewer: SessionUser | null }) {
  if (functions.length === 0) return null;
  return <div className="mt-8 space-y-4" />;
}
