import Image from "next/image";
import Link from "next/link";
import { Penguin } from "@/components/Penguin";
import { Reveal } from "@/components/marketing/Reveal";
import { Ribbon } from "@/components/marketing/Ribbon";

const cta = "inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold transition-transform duration-150 ease-[var(--ease-out)] active:scale-[0.97]";

function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span aria-hidden>🐧</span> Huddle
        </Link>
        <div className="hidden gap-8 text-sm md:flex">
          <a href="#features">Features</a>
          <a href="#benefits">Benefits</a>
          <a href="#how">How Huddle works?</a>
          <a href="#pricing">Pricing</a>
        </div>
        <Link href="/login" className={`${cta} bg-huddle-yellow`}>
          Join The Huddle
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden pb-40 pt-10 text-center sm:pb-56">
      <Ribbon />
      <div className="hero-enter relative z-10 mx-auto max-w-3xl px-4">
        <Image src="/landing/hero.v2.webp" alt="" width={432} height={424} priority className="mx-auto h-auto w-40 sm:w-52" />
        <p className="mt-4 flex items-center justify-center gap-3 text-xs">
          Introducing Functions <span aria-hidden>◆◇</span> Organise Meetings
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.02] sm:text-7xl">
          Join the huddle.
          <br />
          Connect, <em>monetize</em> your <span className="text-ink/55">communities.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-[15px]">
          The platform that lets organisations run events, gate exclusive content, and earn from their community. All in one place.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/login" className={`${cta} min-w-40 bg-huddle-yellow`}>
            Get started
          </Link>
          <a href="#how" className={`${cta} min-w-40 border border-ink bg-surface`}>
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}

function WhatIs() {
  return (
    <section className="mx-auto max-w-[1280px] px-2 sm:px-4">
      <div className="relative z-10 grid items-center gap-10 overflow-hidden rounded-[48px] bg-huddle-purple px-6 py-14 text-white sm:px-16 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <h2 className="font-serif text-5xl leading-none sm:text-6xl">
            What is
            <br />
            Huddle?
          </h2>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/90">
            Huddle is a platform for churches, community groups, schools and teams to run their events and earn from them. Through
            modular capabilities called <strong>Functions</strong>, you shape each meeting to fit. Lock recordings and resources behind a
            payment, or let people pick their own number and call them up live.
          </p>
          <p className="mt-4 max-w-lg text-[15px] text-white/90">Pick what your event needs. Attach it. Done.</p>
          <a href="#features" className="mt-8 inline-flex items-center gap-3 text-sm">
            Discover how Huddle Functions work <span aria-hidden>→</span>
          </a>
        </Reveal>
        <Reveal delay={120} className="justify-self-center">
          <Image src="/landing/phone.v2.webp" alt="A phone showing a locked study guide with a Purchase Access button" width={1200} height={1580} className="h-auto w-72 sm:w-96" />
        </Reveal>
      </div>
      <div className="-mt-12 rounded-b-[48px] bg-ink px-6 pb-8 pt-20 text-center text-paper">
        <p className="text-sm text-paper/70">Works alongside the tools you already use</p>
        <p className="mt-3 flex flex-wrap justify-center gap-x-8 gap-y-2 text-lg font-semibold">
          <span>Zoom</span>
          <span>Google Meet</span>
          <span>Teams</span>
          <span>YouTube Live</span>
          <span>Paystack</span>
        </p>
      </div>
    </section>
  );
}

function Quote() {
  const chip = "mx-2 inline-flex h-12 w-12 -translate-y-1 items-center justify-center rounded-2xl align-middle text-2xl sm:h-14 sm:w-14";
  return (
    <section className="mx-auto max-w-3xl px-4 py-32 text-center sm:py-44">
      <Reveal>
        <p className="font-serif text-4xl leading-[1.35] sm:text-6xl">
          &ldquo;Have all of <span className={`${chip} bg-huddle-yellow`}>🧰</span> the tools <span className="text-ink/45">you need</span>
          <span className={`${chip} bg-huddle-lilac`}>🙌</span> to better <span className="text-ink/45">control your meetings, in</span>
          <span className={`${chip} bg-huddle-sky`}>🐧</span> <span className="text-ink/45">one place&rdquo;</span>
        </p>
      </Reveal>
    </section>
  );
}

const FEATURE_CHIPS = ["Number Picker", "Extra Content", "RSVP & Seats", "Voting & Polls", "Q&A Queue", "Certificate"];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1280px] scroll-mt-20 px-2 sm:px-4">
      <div className="grid items-center gap-10 rounded-[48px] bg-ink px-6 py-16 text-paper sm:px-16 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <h2 className="font-serif text-5xl sm:text-6xl">Features</h2>
          <p className="mt-4 text-2xl">
            Special functions <span className="text-huddle-yellow">for your meetings</span>
          </p>
          <p className="mt-6 max-w-md text-sm text-paper/80">
            Functions give you complete control and flexibility, helping you run secure, engaging, and profitable gatherings — in person or online.
          </p>
          <div className="mt-8 flex max-w-md flex-wrap gap-2">
            {FEATURE_CHIPS.map((c, i) => (
              <span key={c} className={`rounded-full border px-4 py-1.5 text-sm ${i === 0 ? "border-huddle-yellow bg-huddle-yellow text-ink" : "border-paper/60"}`}>
                {c}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120} className="justify-self-center">
          <Image src="/landing/plug.v2.webp" alt="" width={570} height={740} className="h-auto w-48 sm:w-60" />
        </Reveal>
      </div>
    </section>
  );
}

const ROWS = [
  { img: "card_lock.v2", title: "Keep your work safe, valued, and paid", body: "Gate recordings, documents and videos behind a payment or an access code.", alt: "A locked lecture transcript" },
  { img: "card_numbers.v2", title: "Get reservations, and number allocations", body: "Let guests lock in a seat and choose their own number instantly. Works for physical and virtual meetings.", alt: "A grid of numbers with some picked" },
  { img: "card_chat.v2", title: "One home for discussions, Q&As, and live polls", body: "Bring your audience into one space. Gather live feedback and keep the conversation going. Coming soon.", alt: "A chat thread from The Watchers Channel" },
  { img: "card_cert", title: "Issue verified proof of attendance", body: "Reward attendees with a certificate the moment your session ends. Coming soon.", alt: "A certificate of completion" },
];

function FeatureRows() {
  return (
    <section className="mx-auto max-w-5xl space-y-24 px-4 py-28">
      {ROWS.map((r, i) => (
        <div key={r.img} className={`grid items-center gap-10 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
          <Reveal>
            <Image src={`/landing/${r.img}.webp`} alt={r.alt} width={1104} height={1232} className="h-auto w-full max-w-sm justify-self-center rounded-[40px]" />
          </Reveal>
          <Reveal delay={100}>
            <h3 className="font-serif text-4xl leading-tight sm:text-5xl">{r.title}</h3>
            <p className="mt-4 max-w-sm text-sm">{r.body}</p>
            <Link href="/login" className={`${cta} mt-6 bg-huddle-yellow`}>
              Learn more
            </Link>
          </Reveal>
        </div>
      ))}
    </section>
  );
}

function Benefits() {
  return (
    <section
      id="benefits"
      className="scroll-mt-20 bg-huddle-coral py-16"
      style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 38px, rgba(255,255,255,0.8) 38px 40px)", backgroundSize: "70% 100%", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4">
        <Reveal>
          <Image src="/landing/notes_top.v2.webp" alt="Profit: what you build stays valuable. Order: reservations turn a crowd into a queue." width={1386} height={765} className="h-auto w-full max-w-xl" />
        </Reveal>
        <h2 className="text-center text-4xl font-bold leading-tight text-white sm:text-5xl">
          Benefits that
          <br />
          Huddle provides.
        </h2>
        <Reveal delay={100}>
          <Image src="/landing/notes_bottom.v2.webp" alt="Continuity: Forum Access keeps your community connected. Proof: a Certificate turns attendance into an achievement." width={1346} height={726} className="h-auto w-full max-w-lg" />
        </Reveal>
      </div>
    </section>
  );
}

function Step({ n, title, body, children }: { n: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <Reveal className="flex flex-col items-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-ink bg-huddle-yellow font-serif text-3xl">{n}</span>
      <h3 className="mt-6 text-2xl font-medium">{title}</h3>
      <p className="mt-2 max-w-sm text-lg">{body}</p>
      {children && <div className="mt-10">{children}</div>}
    </Reveal>
  );
}

const Divider = () => <div className="mx-auto my-14 h-24 w-px bg-ink" aria-hidden />;

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 px-4 py-28">
      <h2 className="mb-16 text-center font-serif text-5xl">How It Works</h2>
      <Step n="01" title="Create your organisation" body="Set up in minutes. No sales calls, no setup fees.">
        <div className="w-72 space-y-3 text-left">
          <div className="rounded-xl border border-ink px-4 py-3 text-sm text-slate">Organisation name</div>
          <div className="rounded-xl border border-ink px-4 py-3 text-sm text-slate">Your Huddle link</div>
          <Link href="/login" className="inline-block rounded-xl bg-huddle-yellow px-4 py-2 text-sm font-semibold">
            Create Org.
          </Link>
        </div>
      </Step>
      <Divider />
      <Step n="02" title="Build your event" body="Add the details. Pick a date. You're live.">
        <Image src="/landing/calendar.v2.webp" alt="A date and time picker" width={1034} height={1167} className="h-auto w-72" />
      </Step>
      <Divider />
      <Step n="03" title="Attach what you need" body="Number Picker. RSVP & Seats. Extra Content. Only what fits.">
        <div className="w-72 space-y-2 text-left">
          {["Number Picker", "Extra Content"].map((f) => (
            <div key={f} className="flex items-center gap-3 rounded-xl border border-ink bg-huddle-yellow px-4 py-3 text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">✓</span>
              {f}
            </div>
          ))}
        </div>
      </Step>
      <Divider />
      <Step n="04" title="Bring your people in" body="They register, reserve, engage — all in one place.">
        <Image src="/landing/monitor.webp" alt="" width={328} height={328} className="h-auto w-44" />
      </Step>
      <Divider />
      <Step n="05" title="Earn from what you built" body="Gate it, price it, get paid. You keep the majority.">
        <Image src="/landing/coins.v2.webp" alt="" width={940} height={600} className="h-auto w-56" />
      </Step>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 px-4 pb-28">
      <Reveal className="mx-auto max-w-xl rounded-[40px] bg-huddle-yellow p-10 text-center">
        <Penguin mood="wave" size={96} className="mx-auto" />
        <h2 className="mt-4 font-serif text-5xl">
          Free to start. <em>Really.</em>
        </h2>
        <p className="mx-auto mt-4 max-w-sm">
          No monthly fee. When you earn, Huddle keeps 5% and your share lands in your bank account. Pro and Scale plans with lower fees are coming soon.
        </p>
        <Link href="/login" className={`${cta} mt-8 bg-ink text-paper`}>
          Create your organisation — it takes 2 minutes
        </Link>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink/10 px-4 py-10 text-center text-sm text-slate">
      <p className="font-serif text-2xl text-ink">Where organisations bring their people together.</p>
      <p className="mt-3">Built by The Watchers Channel &amp; Vivant Enterprises · Huddle © 2026</p>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="flex-1 bg-surface">
      <Nav />
      <main>
        <Hero />
        <WhatIs />
        <Quote />
        <Features />
        <FeatureRows />
        <Benefits />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
