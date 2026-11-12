/** Huddle's platform fee in kobo, rounded up so partial kobo always go to the platform. */
export function huddleFeeKobo(amountKobo: number, feeBps: number): number {
  return Math.ceil((amountKobo * feeBps) / 10000);
}
