import Link from "next/link";
import { Penguin } from "@/components/Penguin";
import { getSession } from "@/lib/auth/session";
import { formatEventTime } from "@/lib/events/time";
import { getMyHuddles, meAccess } from "@/lib/me/queries";
import { LoginForm } from "../login/LoginForm";

export const metadata = { title: "My Huddles" };

export default async function MePage() {
  const session = await getSession();

  if (meAccess(session?.user ?? null) === "verify") {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-4xl">
            Your <em>huddles</em>
          </h1>
          <p className="mt-2 text-slate">Enter the email you used, and we&apos;ll send you a link to see your numbers, seats and content.</p>
          <LoginForm callbackURL="/me" />
        </div>
      </main>
    );
  }

  const huddles = await getMyHuddles(session!.user.id);
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <p className="text-sm text-slate">Hi {session!.user.name.split(" ")[0]} 👋</p>
      <h1 className="font-serif text-5xl">My huddles</h1>
      {huddles.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Penguin mood="sleepy" size={120} />
          <p className="mt-4 text-slate">Nothing here yet. When you join an event, it shows up here.</p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {huddles.map((h) => (
            <li key={h.event.id}>
              <Link href={`/${h.org.slug}/${h.event.slug}`} className="block rounded-3xl bg-surface p-5 transition-transform duration-150 hover:-translate-y-0.5">
                <p className="text-sm text-slate">
                  {h.org.name} · {formatEventTime(h.event.startsAt)}
                </p>
                <p className="font-serif text-2xl">{h.event.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {h.items.map((i) => (
                    <span key={i.functionId} className="rounded-full bg-huddle-yellow/60 px-3 py-1 text-sm font-semibold">
                      {i.label}: {i.detail}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
