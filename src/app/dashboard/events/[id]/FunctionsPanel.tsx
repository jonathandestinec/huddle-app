import type { Event, EventFunction } from "@/lib/events/service";

/** Placeholder — replaced by the Function Store in Task 8. */
export function FunctionsPanel({ functions }: { event: Event; functions: EventFunction[]; hasBank: boolean }) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate">Functions</h2>
      <p className="text-slate">{functions.length} attached</p>
    </section>
  );
}
