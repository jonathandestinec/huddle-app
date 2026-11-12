import Link from "next/link";
import { requireCurrentOrg } from "@/lib/orgs/current";
import { listBanks } from "@/lib/paystack/client";
import { BankForm } from "./BankForm";

export default async function BankPage() {
  const { org } = await requireCurrentOrg();
  const banks = await listBanks().catch(() => []);
  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-4xl leading-tight">Where should we send your earnings?</h1>
      <p className="mt-2 text-slate">
        When people pay for something at your events, your share goes straight to this account. Huddle keeps 5%.
      </p>
      {org.paystackSubaccountCode ? (
        <div className="mt-8 rounded-3xl border border-ink/[0.12] bg-surface p-5">
          <p className="font-semibold">You&apos;re all set ✓</p>
          <p className="text-sm text-slate">
            Paying out to {org.bankName} ••••{org.accountLast4}
          </p>
          <Link href="/dashboard/events" className="mt-4 inline-block font-semibold underline">
            Go to your events →
          </Link>
        </div>
      ) : (
        <>
          <BankForm organisationId={org.id} banks={banks} />
          <Link href="/dashboard/events" className="mt-4 block text-center text-sm text-slate underline">
            Skip for now — I&apos;ll only run free events
          </Link>
        </>
      )}
    </div>
  );
}
