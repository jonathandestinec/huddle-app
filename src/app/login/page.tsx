import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const callbackURL = typeof next === "string" && next.startsWith("/") ? next : "/dashboard";
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-sm font-semibold">🐧 Huddle</p>
        <h1 className="font-serif text-4xl leading-tight">
          Welcome to the <em>huddle.</em>
        </h1>
        <p className="mt-2 text-slate">Sign in or create your organisation&apos;s account.</p>
        <LoginForm callbackURL={callbackURL} />
      </div>
    </main>
  );
}
