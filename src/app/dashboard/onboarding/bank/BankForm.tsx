"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { linkBankAction, resolveAccountAction } from "@/lib/orgs/bank-actions";

export function BankForm({ organisationId, banks }: { organisationId: string; banks: { name: string; code: string }[] }) {
  const router = useRouter();
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const bankName = banks.find((b) => b.code === bankCode)?.name ?? "";

  useEffect(() => {
    setAccountName(undefined);
    setError(undefined);
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) return;
    let live = true;
    resolveAccountAction(organisationId, accountNumber, bankCode).then((r) => {
      if (!live) return;
      if (r.ok) setAccountName(r.data.accountName);
      else setError(r.error);
    });
    return () => {
      live = false;
    };
  }, [bankCode, accountNumber, organisationId]);

  function confirm() {
    start(async () => {
      const r = await linkBankAction(organisationId, { bankCode, bankName, accountNumber });
      if (!r.ok) return setError(r.error);
      router.push("/dashboard/events");
    });
  }

  return (
    <div className="mt-8 space-y-5">
      <Field label="Bank">
        <Select
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
          className="w-full rounded-2xl border border-ink/10 bg-surface px-4 py-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-ink/25 focus:ring-4 focus:ring-ink/[0.05]"
        >
          <option value="">Choose your bank</option>
          {banks.map((b) => (
            <option key={`${b.code}-${b.name}`} value={b.code}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Account number" error={error}>
        <Input
          inputMode="numeric"
          maxLength={10}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          placeholder="0123456789"
        />
      </Field>
      {accountName && (
        <div className="rounded-2xl bg-mist p-4">
          <p className="text-sm">
            Paying out to <strong>{accountName}</strong>. Is that right?
          </p>
          <Button onClick={confirm} disabled={pending} className="mt-3 w-full" variant="dark">
            {pending ? "Linking…" : "Yes, link this account"}
          </Button>
        </div>
      )}
    </div>
  );
}
