import Link from "next/link";
import { Penguin } from "@/components/Penguin";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <Penguin mood="sleepy" size={140} />
      <h1 className="mt-6 font-serif text-4xl">
        This huddle has <em>wandered off.</em>
      </h1>
      <p className="mt-2 text-slate">The link might be wrong, or the event isn&apos;t public yet.</p>
      <Link href="/" className="mt-6 rounded-full bg-huddle-yellow px-5 py-3 font-bold">
        Back to Huddle
      </Link>
    </main>
  );
}
