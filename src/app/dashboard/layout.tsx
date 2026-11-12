import Link from "next/link";
import { SoundToggle } from "@/components/SoundToggle";
import { requireUser } from "@/lib/auth/session";
import { getMyOrganisations } from "@/lib/orgs/service";
import { SignOutButton } from "./SignOutButton";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  const [org] = await getMyOrganisations(user.id);
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-ink/8 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <Link href="/dashboard" className="flex min-h-12 items-center gap-2 font-bold">
            <span aria-hidden className="text-xl">🐧</span>
            <span className="truncate">{org?.name ?? "Huddle"}</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-[0.95rem]">
            {org && (
              <>
                <Link href="/dashboard/events" className="hidden min-h-12 items-center rounded-[14px] px-3 font-semibold sm:flex [@media(hover:hover)]:hover:bg-ink/5">
                  Events
                </Link>
                <Link
                  href="/dashboard/onboarding/bank"
                  className="hidden min-h-12 items-center rounded-[14px] px-3 font-semibold sm:flex [@media(hover:hover)]:hover:bg-ink/5"
                >
                  Payouts
                </Link>
              </>
            )}
            <SoundToggle />
            <SignOutButton email={user.email} />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-8 sm:pb-16">{children}</main>
    </div>
  );
}
