import Link from "next/link";
import { Penguin } from "@/components/Penguin";
import { settlePayment } from "@/lib/payments/settle";

export default async function PaidPage({ params, searchParams }: PageProps<"/[org]/[event]/paid">) {
  const { org, event } = await params;
  const { ref } = await searchParams;
  const back = `/${org}/${event}`;
  const result = typeof ref === "string" && ref.startsWith("hud_") ? await settlePayment(ref, "verify").catch(() => "error" as const) : "error";
  const ok = result === "settled" || result === "already_settled";

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
