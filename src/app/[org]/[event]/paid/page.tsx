import Link from "next/link";
import { Penguin } from "@/components/Penguin";
import { releaseHoldForReference } from "@/functions/number-picker/release";
import { settlePayment } from "@/lib/payments/settle";

export default async function PaidPage({ params, searchParams }: PageProps<"/[org]/[event]/paid">) {
  const { org, event } = await params;
  const { ref } = await searchParams;
  const back = `/${org}/${event}`;
  const result = typeof ref === "string" && ref.startsWith("hud_") ? await settlePayment(ref, "verify").catch(() => "error" as const) : "error";
  const ok = result === "settled" || result === "already_settled";
  // Not paid (cancelled at checkout, or it failed): give back any number they were holding.
  const released =
    !ok && typeof ref === "string" && ref.startsWith("hud_")
      ? await releaseHoldForReference(ref).catch(() => ({ status: "none" as const }))
      : { status: "none" as const };

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <Penguin mood={ok ? "wave" : "sleepy"} size={140} />
      {ok ? (
        <>
          <h1 className="mt-6 font-serif text-5xl">
            You&apos;re <em>in.</em>
          </h1>
          <p className="mt-2 text-slate">Payment received. We&apos;ve emailed you a receipt.</p>
        </>
      ) : released.status === "released" ? (
        <>
          <h1 className="mt-6 font-serif text-4xl">Payment cancelled</h1>
          <p className="mt-2 max-w-sm text-slate">
            You weren&apos;t charged, and #{released.number} is free again. Head back to pick a number whenever you&apos;re ready.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-6 font-serif text-4xl">We couldn&apos;t confirm that payment yet</h1>
          <p className="mt-2 max-w-sm text-slate">
            If you were charged, it usually shows up within a minute. Head back to the event and refresh.
          </p>
        </>
      )}
      <Link href={back} className="mt-8 rounded-full bg-huddle-yellow px-6 py-3 font-bold">
        Back to the event
      </Link>
    </main>
  );
}
