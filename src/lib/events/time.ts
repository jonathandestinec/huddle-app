/** Africa/Lagos is UTC+1 all year (no DST), so a fixed offset is exact. */
const LAGOS_OFFSET = "+01:00";
const LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function lagosLocalToUtc(local: string): Date {
  if (!LOCAL_PATTERN.test(local)) throw new Error("Pick a date and time");
  const d = new Date(`${local}:00${LAGOS_OFFSET}`);
  if (Number.isNaN(d.getTime())) throw new Error("Pick a date and time");
  return d;
}

/** For prefilling <input type="datetime-local">. */
export function utcToLagosLocal(d: Date): string {
  return new Date(d.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
}

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatEventTime(d: Date): string {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.weekday} ${p.day} ${p.month} · ${p.hour}:${p.minute} ${String(p.dayPeriod).toUpperCase()}`;
}
