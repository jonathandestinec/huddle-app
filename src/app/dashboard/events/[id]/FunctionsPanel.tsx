import { ALL_FUNCTION_TYPES, COMING_SOON, getFunctionDefinition } from "@/functions/registry";
import type { Event, EventFunction } from "@/lib/events/service";
import { koboToNairaInput } from "@/lib/money";
import { StoreCard } from "./StoreCard";

export function FunctionsPanel({
  event,
  functions,
  hasBank,
  extras,
}: {
  event: Event;
  functions: EventFunction[];
  hasBank: boolean;
  /** Per-function extra panels (e.g. Extra Content's item manager), keyed by function id. */
  extras?: Record<string, React.ReactNode>;
}) {
  const attached = new Map(functions.map((f) => [f.type, f]));
  return (
    <section>
      <h2 className="font-serif text-3xl">
        Pick what your event needs
      </h2>
      <p className="mt-2 text-slate">Tap one to add it. You can change or remove it any time before people start using it.</p>
      <div className="mt-6 space-y-3">
        {ALL_FUNCTION_TYPES.map((type) => {
          const def = getFunctionDefinition(type);
          const f = attached.get(type);
          return (
            <StoreCard
              key={type}
              eventId={event.id}
              hasBank={hasBank}
              label={def.label}
              description={def.description}
              emoji={def.emoji}
              initial={{
                id: f?.id,
                type,
                gate: f?.gate ?? "free",
                priceNaira: koboToNairaInput(f?.priceKobo ?? null),
                config: (f?.config as Record<string, unknown>) ?? def.defaultConfig,
                hasCode: !!f?.accessCodeHash,
              }}
              extra={f ? extras?.[f.id] : undefined}
            />
          );
        })}
        <p className="pt-4 text-[0.95rem] font-medium text-slate">Coming soon</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {COMING_SOON.map((c) => (
            <div key={c.label} className="rounded-3xl bg-ink/[0.03] p-4 opacity-75">
              <p className="font-semibold">
                {c.emoji} {c.label}
              </p>
              <p className="text-sm text-slate">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
