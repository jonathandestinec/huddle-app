import { PaystackError } from "@/lib/paystack/client";

/** Turns a Paystack failure during bank linking into something an organiser can act on. */
export function friendlyBankError(err: PaystackError): string {
  if (err.status === 429 || /test mode daily limit/i.test(err.message)) {
    return "Paystack test mode only allows 3 real account checks a day. Switch Huddle to your live Paystack keys to link a real bank account.";
  }
  if (err.status === 401 || /invalid key/i.test(err.message)) {
    return "Huddle's Paystack keys aren't valid. Check the Paystack keys in your settings.";
  }
  if (err.status >= 500) return "Paystack is having trouble right now. Try again in a minute.";
  return "We couldn't find that account. Check the number and bank.";
}
