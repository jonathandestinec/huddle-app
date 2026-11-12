import Link from "next/link";
import { SoundToggle } from "@/components/SoundToggle";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-ink/10 bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="font-semibold">
            🐧 Huddle
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate">{user.email}</span>
            <SoundToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
