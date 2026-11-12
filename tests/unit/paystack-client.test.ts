import { afterEach, describe, expect, it, vi } from "vitest";
import { PaystackError, initializeTransaction, resolveAccount, verifyTransaction } from "@/lib/paystack/client";

function mockFetch(body: unknown, status = 200) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("initializeTransaction", () => {
  it("sends the split with the org bearing Paystack fees", async () => {
    const f = mockFetch({ status: true, data: { authorization_url: "https://checkout.paystack.com/x" } });
    const r = await initializeTransaction({
      email: "a@b.co",
      amountKobo: 200000,
      reference: "hud_1",
      callbackUrl: "http://localhost:3000/wc/sunday/paid?ref=hud_1",
      subaccount: "ACCT_abc",
      transactionChargeKobo: 10000,
      metadata: { claimId: "c1" },
    });
    expect(r.authorizationUrl).toBe("https://checkout.paystack.com/x");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.paystack.co/transaction/initialize");
    expect((init.headers as Record<string, string>).Authorization).toMatch(/^Bearer sk_test_/);
    expect(JSON.parse(init.body as string)).toMatchObject({
      email: "a@b.co",
      amount: 200000,
      currency: "NGN",
      reference: "hud_1",
      subaccount: "ACCT_abc",
      transaction_charge: 10000,
      bearer: "subaccount",
      metadata: { claimId: "c1" },
    });
  });
});

describe("errors", () => {
  it("throws PaystackError when status is false", async () => {
    mockFetch({ status: false, message: "Invalid key" }, 401);
    await expect(resolveAccount("0123456789", "058")).rejects.toBeInstanceOf(PaystackError);
  });
});

describe("verifyTransaction", () => {
  it("maps the response", async () => {
    mockFetch({ status: true, data: { status: "success", amount: 200000, reference: "hud_1" } });
    expect(await verifyTransaction("hud_1")).toEqual({ status: "success", amountKobo: 200000, reference: "hud_1" });
  });
});
