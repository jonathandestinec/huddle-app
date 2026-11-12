import { getEnv } from "@/lib/env";

const BASE = "https://api.paystack.co";

export class PaystackError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "PaystackError";
  }
}

async function call<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${getEnv().PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || !json.status) throw new PaystackError(json.message ?? `Paystack error ${res.status}`, res.status);
  return json.data as T;
}

export async function listBanks(): Promise<{ name: string; code: string }[]> {
  const data = await call<{ name: string; code: string; active: boolean }[]>("/bank?country=nigeria&currency=NGN&perPage=100");
  return data.filter((b) => b.active !== false).map(({ name, code }) => ({ name, code }));
}

export async function resolveAccount(accountNumber: string, bankCode: string): Promise<{ accountName: string }> {
  const data = await call<{ account_name: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
  return { accountName: data.account_name };
}

export async function createSubaccount(input: {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge: number;
}): Promise<{ subaccountCode: string }> {
  const data = await call<{ subaccount_code: string }>("/subaccount", {
    method: "POST",
    body: {
      business_name: input.businessName,
      settlement_bank: input.bankCode,
      account_number: input.accountNumber,
      percentage_charge: input.percentageCharge,
    },
  });
  return { subaccountCode: data.subaccount_code };
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  subaccount: string;
  transactionChargeKobo: number;
  metadata: Record<string, unknown>;
}): Promise<{ authorizationUrl: string }> {
  const data = await call<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: {
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      subaccount: input.subaccount,
      transaction_charge: input.transactionChargeKobo,
      bearer: "subaccount",
      metadata: input.metadata,
    },
  });
  return { authorizationUrl: data.authorization_url };
}

export async function verifyTransaction(
  reference: string,
): Promise<{ status: "success" | "failed" | "abandoned" | (string & {}); amountKobo: number; reference: string }> {
  const data = await call<{ status: string; amount: number; reference: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return { status: data.status, amountKobo: data.amount, reference: data.reference };
}
