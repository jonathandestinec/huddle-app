/** "2,000" → 200000, "1500.50" → 150050. Throws on anything that isn't a plain non-negative amount. */
export function nairaToKobo(input: string): number {
  const cleaned = input.replace(/[₦,\s]/g, "");
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!m) throw new Error("Enter an amount like 2,000 or 1500.50");
  const kobo = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(kobo)) throw new Error("That amount is too large");
  return kobo;
}

export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString("en-NG", {
    minimumFractionDigits: kobo % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function koboToNairaInput(kobo: number | null): string {
  if (kobo == null) return "";
  return kobo % 100 === 0 ? String(kobo / 100) : (kobo / 100).toFixed(2);
}
