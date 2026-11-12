import { settlePayment } from "@/lib/payments/settle";
import { verifyPaystackSignature } from "@/lib/paystack/signature";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyPaystackSignature(raw, req.headers.get("x-paystack-signature"))) {
    console.warn("[paystack webhook] invalid signature");
    return new Response("invalid signature", { status: 401 });
  }

  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const ref = payload.data?.reference;
  if (payload.event === "charge.success" && ref?.startsWith("hud_")) {
    try {
      const result = await settlePayment(ref, "webhook");
      console.info(`[paystack webhook] ${ref} → ${result}`);
    } catch (err) {
      console.error(`[paystack webhook] ${ref} failed`, err);
      return new Response("retry", { status: 500 }); // Paystack retries non-2xx
    }
  }
  return new Response("ok");
}
