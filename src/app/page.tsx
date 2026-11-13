import Image from "next/image";
import Link from "next/link";
import { MobileMenu } from "@/components/marketing/MobileMenu";
import { Ribbon } from "@/components/marketing/Ribbon";


/*
 * Landing page, built to the Figma frame (design/Desktop.png, 1280px content width).
 * Colours come from the shared brand tokens (ink #1A1A1A, yellow #FEF16C), which match the Figma.
 */

const pill =
  "inline-flex select-none items-center justify-center rounded-full font-medium transition-[transform,background-color,color,box-shadow] duration-200 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/25";
/** Yellow pill: deepens on hover. */
const pillYellow = `${pill} bg-huddle-yellow [@media(hover:hover)]:hover:bg-huddle-yellow-deep`;
/** Outlined pill: fills with ink on hover. */
const pillOutline = `${pill} border border-ink [@media(hover:hover)]:hover:bg-ink [@media(hover:hover)]:hover:text-white`;
/** Text link with an underline that draws in on hover and focus. */
const navLink =
  "relative rounded-[6px] after:absolute after:inset-x-0 after:-bottom-[3px] after:h-[1.5px] after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-[var(--ease-out)] hover:after:scale-x-100 focus-visible:outline-none focus-visible:after:scale-x-100";
const serifH2 = "font-serif text-[52px] leading-[0.97] sm:text-[72px]";

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 36" className={className} aria-hidden="true">
      <path d="M2.6 0.4c1.3-.3 2.6.5 2.8 1.8l.4 31.3c0 1.4-1 2.5-2.4 2.5S1 34.9 1 33.5L.6 2.8C.5 1.6 1.4.6 2.6.4Z" fill="currentColor" />
      <rect x="9.6" y="14" width="5" height="22" rx="2.5" fill="currentColor" />
    </svg>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-white">
      <nav className="relative mx-auto flex h-[84px] max-w-[1280px] items-center gap-2 px-4 sm:px-5 lg:h-[108px] lg:px-[78px]" aria-label="Main">
        <Link href="/" className="flex items-center gap-[10px] rounded-[10px] text-[28px] font-semibold tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/20 lg:text-[38px]" aria-label="Huddle home">
          <LogoMark className="h-[30px] w-auto lg:h-[36px]" />
          Huddle
        </Link>
        <div className="ml-[128px] hidden gap-[39px] text-[19px] lg:flex">
          <a href="#features" className={navLink}>
            Features
          </a>
          <a href="#benefits" className={navLink}>
            Benefits
          </a>
          <a href="#how" className={navLink}>
            How Huddle works?
          </a>
          <a href="#pricing" className={navLink}>
            Pricing
          </a>
        </div>
        <Link href="/login" className={`${pillYellow} ml-auto h-[44px] px-5 text-[16px] sm:px-6 sm:text-[17px] lg:h-[48px] lg:w-[209px] lg:text-[19px]`}>
          Join The Huddle
        </Link>
        <MobileMenu />
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden text-center lg:h-[1043px]">
      <div className="hero-enter relative z-10 mx-auto max-w-[1280px] px-5 pt-8 lg:pt-[40px]">
        <Image src="/landing/hero-woman.png" alt="" width={216} height={212} priority className="mx-auto h-auto w-[170px] lg:w-[216px]" />
        <p className="mt-6 flex items-center justify-center gap-4 text-[14px] lg:mt-[18px] lg:text-[16px]">
          Introducing Plugins
          <Image src="/landing/sparkles.png" alt="" width={46} height={33} className="h-auto w-[46px]" />
          Organise Meetings
        </p>
        <h1 className="mx-auto mt-5 text-balance font-serif text-[44px] leading-[0.95] tracking-[-0.01em] sm:text-[60px] lg:mt-[22px] lg:text-[76px] lg:leading-[0.86]">
          Join the huddle.
          <br />
          Connect, <em>monetize</em> your <span className="text-[#656565]">communities.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[560px] text-pretty text-[17px] leading-[1.42] lg:mt-[36px] lg:text-[20px]">
          The platform that lets organisations run events, gate exclusive content, and earn from their community. All in one place.
        </p>
        <div className="mt-8 flex flex-col items-center gap-[19px] lg:mt-[41px]">
          <Link href="/login" className={`${pillYellow} h-[48px] w-[209px] text-[20px]`}>
            Get started
          </Link>
          <a href="#how" className={`${pillOutline} h-[48px] w-[209px] text-[20px]`}>
            Watch video
          </a>
        </div>
      </div>

      {/* The ribbon, with the unlocked file chip sitting on it. */}
      <div className="relative -mt-14 h-[300px] sm:mt-6 sm:h-[360px] lg:absolute lg:inset-x-0 lg:top-[532px] lg:mt-0 lg:h-[470px]">
        <div className="absolute inset-y-0 left-1/2 w-[2900px] -translate-x-1/2 max-lg:w-[2210px] max-sm:w-[1812px]">
          <Ribbon className="h-full w-full" />
          <span className="absolute left-[1379px] top-[249px] flex h-[60px] w-[145px] items-center gap-[12px] rounded-full bg-ink pl-[16px] text-[20px] text-white max-lg:left-[1048px] max-lg:top-[178px] max-lg:h-[48px] max-lg:w-[118px] max-lg:gap-2 max-lg:pl-3 max-lg:text-[17px] max-sm:left-[859px] max-sm:top-[150px] max-sm:h-[42px] max-sm:w-[104px] max-sm:text-[15px]">
            <Image src="/landing/icon-unlock.png" alt="" width={21} height={33} className="h-[33px] w-auto max-lg:h-[26px] max-sm:h-[22px]" />
            Book.pdf
          </span>
        </div>
      </div>
    </section>
  );
}

const LOGOS = [
  { src: "meet", w: 124, h: 38, alt: "Google Meet" },
  { src: "teams", w: 131, h: 35, alt: "Microsoft Teams" },
  { src: "zoom", w: 99, h: 23, alt: "Zoom" },
  { src: "stripe", w: 77, h: 32, alt: "Stripe" },
  { src: "paypal", w: 124, h: 31, alt: "PayPal" },
  { src: "google", w: 100, h: 33, alt: "Google" },
];

function WhatIs() {
  return (
    <section className="mx-auto mt-10 max-w-[1280px] px-3 sm:px-4 lg:mt-0 lg:px-0">
      <div className="relative z-10 overflow-hidden rounded-[56px] bg-huddle-purple px-6 pb-12 pt-14 text-white lg:h-[828px] lg:rounded-[120px] lg:px-[133px] lg:pb-0 lg:pt-[160px]">
        <div className="lg:max-w-[575px]">
          <h2 className={serifH2}>
            What is
            <br />
            Huddle?
          </h2>
          <p className="mt-8 text-[17px] leading-[1.42] lg:mt-[26px] lg:text-[19px]">
            Huddle is a platform designed for churches, schools, and organizations to seamlessly monetize their live events.
            <br />
            Through modular capabilities called Functions, you can customize your meetings to fit your exact needs. Easily activate Content
            Protection to lock video recordings and digital resources behind a secure paywall, or use our anonymous Number Picker to
            randomly reward attendees and grant them special privileges during your call.
          </p>
          <p className="mt-6 text-[17px] leading-[1.42] lg:mt-[26px] lg:text-[19px]">
            Huddle is packed with dozens of intuitive tools built to give you complete control over your meetings.
          </p>
          <a href="#features" className="group mt-10 inline-flex items-center gap-[54px] rounded-[8px] text-[17px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 lg:mt-[58px] lg:text-[19px]">
            Discover how Huddle Functions work
            <svg width="33" height="16" viewBox="0 0 33 16" fill="none" aria-hidden="true" className="transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-[6px] group-focus-visible:translate-x-[6px]">
              <path d="M1 8h30M24 1l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Phone with locked material, the yellow blob and the leaf. */}
        <div className="relative mx-auto mt-12 h-[650px] w-[315px] lg:absolute lg:left-[830px] lg:top-[89px] lg:mt-0">
          <Image src="/landing/blob-yellow.png" alt="" width={124} height={129} className="absolute -left-[138px] -top-[50px] w-[120px] max-lg:-left-6 max-lg:-top-10 max-lg:w-20" />
          <div className="absolute inset-[13px] overflow-hidden rounded-[46px] bg-[radial-gradient(28%_18%_at_80%_22%,rgba(184,112,52,0.4),transparent),radial-gradient(30%_22%_at_18%_40%,rgba(130,74,36,0.38),transparent),radial-gradient(120%_70%_at_30%_15%,#6b3d1c_0%,#3d2210_45%,#1d1007_100%)]">
            <p className="mx-auto mt-[84px] w-[160px] text-center text-[24px] leading-[29px]">Weekly Study Guide.pdf</p>
            <div className="relative mx-auto mt-[54px] w-[110px]">
              <Image src="/landing/icon-lock-white.png" alt="" width={110} height={140} className="w-[110px]" />
              <svg className="absolute left-[42px] top-[82px]" width="26" height="40" viewBox="0 0 26 40" aria-hidden="true">
                <path d="M13 1c6.5 0 11 4.6 11 10.2 0 4-2.2 7.3-5.3 9l3.8 15.4c.4 1.8-.9 3.4-2.7 3.4H6.2c-1.8 0-3.1-1.6-2.7-3.4L7.3 20.2C4.2 18.5 2 15.2 2 11.2 2 5.6 6.5 1 13 1Z" fill="#fff" />
              </svg>
            </div>
            <p className="mx-auto mt-[38px] w-[230px] text-center text-[20px] leading-[1.42]">This material is currently locked</p>
            <span className="mx-auto mt-[32px] flex h-[34px] w-[166px] items-center justify-center rounded-full bg-huddle-yellow text-[15px] text-ink">
              Purchase Access
            </span>
            <p className="mt-[28px] text-center text-[15px]">Or enter code to access</p>
            <p className="mt-[16px] text-center text-[34px] font-medium leading-none tracking-[0.02em]">*******</p>
            <span className="mx-auto mt-[12px] block h-px w-[98px] bg-white/80" />
          </div>
          <Image src="/landing/iphone-frame.png" alt="" width={319} height={650} className="pointer-events-none absolute inset-0 h-full w-full" />
          <Image src="/landing/leaf.png" alt="" width={107} height={174} className="absolute -right-[107px] top-[543px] w-[107px] max-lg:-right-4 max-lg:top-[520px] max-lg:w-16" />
        </div>
      </div>

      <div className="-mt-[120px] rounded-b-[56px] bg-ink px-6 pb-12 pt-[150px] text-center lg:h-[355px] lg:rounded-b-[120px] lg:pb-0 lg:pt-[174px]">
        <p className="text-[22px] tracking-[0.04em] text-[#FFFBE6] lg:text-[24px]">Huddle Supports</p>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-[31px] gap-y-5 lg:mt-[43px]">
          {LOGOS.map((l) => (
            <li key={l.src}>
              <Image src={`/landing/logos/${l.src}.svg`} alt={l.alt} width={l.w} height={l.h} className="h-auto" style={{ width: l.w }} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Quote() {
  const chip = "mx-[8px] inline-block h-[42px] w-[34px] -translate-y-[4px] rounded-[10px] sm:mx-[24px] sm:-translate-y-[6px] object-cover align-middle sm:h-[82px] sm:w-[67px] sm:rounded-[14px]";
  // The grey words step lighter across the quote, as in the design (solid colours, no gradient text).
  return (
    <section className="mx-auto max-w-[900px] px-5 py-[96px] text-center sm:py-[140px] lg:pb-[423px] lg:pt-[451px]">
      <p className="text-balance font-serif text-[34px] leading-[1.45] sm:text-[56px] lg:text-[72px] lg:leading-[103px]">
        &ldquo;Have all of
        <Image src="/landing/quote-1.png" alt="" width={82} height={97} className={chip} />
        the tools <span className="text-[#4a4a4a]">you</span>
        <br className="hidden sm:inline" /> need
        <Image src="/landing/quote-2.png" alt="" width={67} height={82} className={chip} />
        to better <span className="text-[#555555]">control</span> <span className="text-[#757575]">your</span>
        <br className="hidden sm:inline" /> meetings, in
        <Image src="/landing/quote-3.png" alt="" width={67} height={82} className={chip} />
        <span className="text-[#7d7d7d]">one place&rdquo;</span>
      </p>
    </section>
  );
}

const FEATURE_CHIPS = ["Vault", "Voting & Polls", "Q&A Queue", "Certificate", "RSVP & Seats"];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1280px] scroll-mt-28 px-3 sm:px-4 lg:px-0">
      <div className="relative overflow-hidden rounded-[56px] bg-ink px-6 py-14 text-white lg:h-[614px] lg:rounded-[110px] lg:px-[133px] lg:py-0 lg:pt-[96px]">
        <h2 className={serifH2}>Features</h2>
        <p className="mt-6 text-[28px] leading-tight lg:mt-[36px] lg:text-[38px]">
          Special functions <span className="text-huddle-yellow">for your meetings</span>
        </p>
        <p className="mt-8 max-w-[600px] text-[17px] leading-[1.42] lg:mt-[46px] lg:text-[19px]">
          Functions are designed to provide complete control and unmatched flexibility, helping you run secure, engaging, and profitable
          virtual stages.
        </p>
        <ul className="mt-8 flex max-w-[470px] flex-wrap gap-x-[8px] gap-y-[6px] lg:mt-[44px]">
          <li className="-rotate-[5deg] rounded-full bg-huddle-yellow px-[20px] py-[9px] text-[19px] leading-[26px] text-ink">Number Picker</li>
          {FEATURE_CHIPS.map((c) => (
            <li key={c} className="rounded-full border-2 border-white px-[18px] py-[7px] text-[19px] leading-[26px]">
              {c}
            </li>
          ))}
        </ul>
        <Image src="/landing/plug.svg" alt="" width={303} height={370} className="mx-auto mt-12 w-[220px] lg:absolute lg:left-[840px] lg:top-[113px] lg:mt-0 lg:w-[303px]" />
      </div>
    </section>
  );
}

function LearnMore() {
  return (
    <Link href="/login" className={`${pillYellow} mt-8 h-[50px] w-[152px] text-[19px] lg:mt-[44px]`}>
      Learn more
    </Link>
  );
}

function RowText({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="max-lg:mx-auto max-lg:w-full max-lg:max-w-[551px] lg:max-w-[380px]">
      <h3 className="text-balance font-serif text-[46px] leading-[1] sm:text-[64px] sm:leading-[70px]">{title}</h3>
      <p className="mt-6 max-w-[372px] text-[17px] leading-[1.42] lg:mt-[46px] lg:text-[20px]">{children}</p>
      <LearnMore />
    </div>
  );
}

/** The soft off-white tile that frames each feature illustration. */
const tile = "landing-tile relative mx-auto w-[551px] shrink-0 rounded-[80px] bg-[#FBFAF8] lg:mx-0";
const frame = "rounded-[40px] border-2 border-ink bg-white";

function LockCard() {
  return (
    <div className={`${tile} h-[611px]`}>
      <div className={`${frame} absolute inset-x-[54px] bottom-0 top-[115px] rounded-b-none border-b-0 text-center`}>
        <span className="mx-auto mt-[16px] block h-[24px] w-[24px] rounded-full bg-ink" />
        <Image src="/landing/avatar.png" alt="" width={109} height={109} className="mx-auto mt-[22px] w-[109px] rounded-full" />
        <p className="mt-[42px] text-[22px] font-medium">Lecture_Transcript.pdf</p>
        <Image src="/landing/lock.svg" alt="" width={87} height={111} className="mx-auto mt-[26px] w-[87px]" />
        <p className="mx-auto mt-[38px] w-[260px] text-[19px] leading-[1.42]">This content can be unlocked by purchasing access</p>
      </div>
    </div>
  );
}

function NumberTile({ n, on }: { n?: number; on?: boolean }) {
  return (
    <span
      className={`flex h-[70px] w-[70px] items-center justify-center rounded-[14px] border-[1.5px] text-[32px] ${
        on ? "border-ink bg-huddle-yellow text-ink" : "border-[#808080] text-[#7f7f7f]"
      }`}
    >
      {n ?? (
        <svg width="32" height="26" viewBox="0 0 32 26" fill="none" aria-hidden="true">
          <path d="M2 13l9 10L30 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function NumbersCard() {
  return (
    <div className={`${tile} h-[615px]`}>
      <div className={`${frame} absolute left-[53px] top-[85px] h-[445px] w-[444px]`}>
        <div className="absolute left-1/2 top-[28px] -translate-x-1/2">
          <span className="absolute left-1/2 top-[68px] h-[38px] w-[124px] -translate-x-1/2 rounded-[50%] bg-[#F4F3F0]" />
          <Image src="/landing/person.png" alt="" width={62} height={95} className="relative w-[62px]" />
        </div>
        <svg className="absolute left-1/2 top-[128px] -translate-x-1/2" width="200" height="80" viewBox="0 0 200 80" fill="none" aria-hidden="true">
          <path d="M100 0v78M100 6c-12 24-60 20-68 44v28M100 6c12 24 60 20 68 44v28" stroke="#1A1A1A" strokeWidth="1.2" />
        </svg>
        <div className="absolute left-1/2 top-[206px] grid -translate-x-1/2 grid-cols-3 gap-x-[21px] gap-y-[21px]">
          <NumberTile on />
          <NumberTile n={23} />
          <NumberTile n={48} on />
          <NumberTile n={49} />
          <NumberTile n={51} on />
          <NumberTile n={55} />
        </div>
        <p className="absolute inset-x-0 top-[390px] text-center text-[19px]">You have picked slot 1</p>
      </div>
    </div>
  );
}

function ChatCard() {
  return (
    <div className={`${tile} h-[615px]`}>
      <div className={`${frame} absolute inset-x-[53px] top-[117px] h-[381px] overflow-hidden`}>
        <div className="flex h-[88px] items-center gap-[10px] border-b border-[#F4F3F0] px-[30px]">
          <span className="h-[46px] w-[46px] rounded-full bg-[linear-gradient(180deg,#9fd3dc_0%,#cfe6ea_70%,#e9b8a6_100%)]" aria-hidden />
          <span className="text-[19px] font-medium">The Watchers Channel</span>
          <span className="ml-auto flex items-center gap-[8px] text-[14px] font-semibold">
            <span className="h-[10px] w-[10px] rounded-full bg-[#ABE69E]" />
            13 online
          </span>
        </div>
        <div className="flex justify-end px-[30px] pt-[46px]">
          <p className="rounded-[28px] rounded-tr-[10px] bg-[#ABE69E] px-[30px] py-[14px] text-[22px] leading-[29px]">Very good. ty :)</p>
        </div>
        <p className="mt-[26px] flex items-center gap-[6px] px-[30px] text-[14px]">
          <span className="h-[36px] w-[36px] rounded-full bg-[radial-gradient(circle_at_50%_40%,#c99a7c_0%,#7a5a48_55%,#e9e4df_100%)]" aria-hidden />
          Destine225_
        </p>
        <p className="ml-[30px] mt-[6px] inline-block rounded-[28px] rounded-tl-[10px] bg-[#F9F7F3] px-[30px] py-[14px] text-[22px] leading-[29px]">
          Thanks for the video!
        </p>
      </div>
    </div>
  );
}

function CertificateCard() {
  const tiny = "text-[11px] leading-[14px] text-[#4a4a4a]";
  return (
    <div className={`${tile} h-[617px]`}>
      <div className={`${frame} absolute inset-x-[54px] top-[119px] h-[378px] px-[52px]`}>
        <Image src="/landing/medal.svg" alt="" width={56} height={51} className="absolute right-[34px] top-[20px] w-[56px]" />
        <p className="mt-[54px] border-b border-[#CFCFCF] pb-[6px] text-[15px] font-semibold">KLISOM Academy</p>
        <p className="mt-[18px] text-[36px] font-bold leading-[40px]">
          Certificate
          <br />
          Of Completion
        </p>
        <div className="mt-[30px] flex items-end justify-between gap-6">
          <div className="w-[213px]">
            <p className={tiny}>awarded to</p>
            <p className="border-b border-[#CFCFCF] pb-[3px] text-[12px] font-semibold">Ryan Gislong</p>
            <p className={`${tiny} mt-[3px]`}>for successfully completing</p>
            <p className="border-b border-[#CFCFCF] pb-[3px] text-[12px] font-semibold">KLISOM Academy</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-semibold">08.08.2023</p>
            <p className={tiny}>John Doe</p>
            <svg width="64" height="34" viewBox="0 0 64 34" fill="none" className="ml-auto" aria-hidden="true">
              <path
                d="M3 30C8 22 13 6 17 3c3-2 2 8 0 14-1 5-5 13-6 10-1-4 7-7 12-7M14 21c4-1 9-3 9 1 0 5 3-14 4-12 0 5-1 14 1 12 2-3 3-14 4-11 1 4 0 12 3 9 3-3 4-6 6-4 2 3 1 6 5 4 3-2 6-4 9-2"
                stroke="#1A1A1A"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="absolute inset-x-[52px] bottom-[42px] flex justify-between">
          <p className={tiny}>certificate number</p>
          <p className="text-[11px] font-semibold tabular-nums">JTT 108</p>
        </div>
      </div>
    </div>
  );
}

function FeatureRows() {
  return (
    <section className="mx-auto max-w-[1280px] px-5 pb-[112px] pt-[96px] lg:px-[113px] lg:pb-[200px] lg:pt-[200px]">
      <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[551px_1fr] lg:gap-[131px]">
        <LockCard />
        <RowText title="Keep your work safe, valued, and paid">Securely gate meeting resources, documents, and videos behind a payment barrier.</RowText>
      </div>
      <div className="mt-[88px] grid items-center gap-12 lg:mt-[155px] lg:grid-cols-[1fr_551px] lg:gap-[100px]">
        <div className="lg:order-2">
          <NumbersCard />
        </div>
        <div className="lg:pl-[4px]">
          <RowText title="Get reservations, and number allocations">
            Simplify ticket allocation. Let guests lock in their reservation and choose their preferred number instantly. This works for both{" "}
            <strong className="font-semibold">Physical</strong> and <strong className="font-semibold">Virtual</strong> meetings
          </RowText>
        </div>
      </div>
      <div className="mt-[88px] grid items-center gap-12 lg:mt-[151px] lg:grid-cols-[551px_1fr] lg:gap-[131px]">
        <ChatCard />
        <RowText title="One home for discussions, Q&As, and live polls">
          Bring audience engagement into a unified forum space. Gather real-time feedback, upvote questions, and foster ongoing conversations.
        </RowText>
      </div>
      <div className="mt-[88px] grid items-center gap-12 lg:mt-[150px] lg:grid-cols-[1fr_551px] lg:gap-[100px]">
        <div className="lg:order-2">
          <CertificateCard />
        </div>
        <RowText title="Issue verified proof of attendance">
          Reward your attendees instantly. Automatically generate and send verified proof of completion the moment your session ends.
        </RowText>
      </div>
    </section>
  );
}

function StickyNote({
  color,
  rotate,
  pin,
  art,
  title,
  body,
  width = 300,
  stack,
  className = "",
}: {
  color: string;
  rotate: number;
  pin?: "green" | "blue";
  width?: number;
  /** Position in the phone pile (0 = first). The last note leaves no scroll gap after it. */
  stack?: { index: number; last?: boolean };
  art: { src: string; w: number; h: number; className: string };
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <>
    <div
      className={`relative h-[305px] shrink-0 px-[16px] pt-[48px] text-center text-ink ${
        stack ? `max-sm:sticky max-sm:top-[var(--pile-top)] max-sm:shadow-[0_18px_36px_-16px_rgba(26,26,26,0.4)]` : ""
      } ${className}`}
      style={{
        background: color,
        width,
        transform: `rotate(${rotate}deg)`,
        ...(stack ? { ["--pile-top" as string]: `${104 + stack.index * 16}px` } : {}),
      }}
    >
      {pin && (
        <span className={`absolute top-0 ${pin === "green" ? "left-[10px]" : "right-[10px]"}`}>
          <span className="absolute left-[12px] top-[18px] h-[22px] w-[22px] rounded-full bg-[#E5584A]" />
          <Image
            src="/landing/pin-green.svg"
            alt=""
            width={55}
            height={49}
            className="relative -top-[14px] w-[44px] max-w-none"
            style={pin === "blue" ? { filter: "hue-rotate(95deg) saturate(1.3)" } : undefined}
          />
        </span>
      )}
      <Image src={`/landing/notes/${art.src}.svg`} alt="" width={art.w} height={art.h} className={`mx-auto h-auto ${art.className}`} />
      <p className="mt-[14px] text-[38px] font-bold leading-none">{title}</p>
      <p className="mx-auto mt-[16px] max-w-[268px] text-[19px] leading-[1.42]">{body}</p>
    </div>
    {/* Phones: scroll room between pile notes. A spacer, not a margin, so every note stays pinned until the last lands. */}
    {stack && <span aria-hidden="true" className={`hidden shrink-0 max-sm:block ${stack.last ? "h-[36vh]" : "h-[42vh]"}`} />}
    </>
  );
}

function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-28 overflow-clip bg-[#ED6A5B]">
      <div className="relative mx-auto max-w-[1280px] px-4 pb-20 pt-16 lg:h-[1163px] lg:px-0 lg:py-0">
      {/* Ruled lines of the pinboard: 74px apart, starting 133px down (13 on desktop, running the full board on phones). */}
      <div className="pointer-events-none absolute inset-x-0 top-[60px] mx-auto w-full max-w-[980px] px-4 lg:top-[133px] lg:px-0" aria-hidden="true">
        {Array.from({ length: 42 }, (_, i) => (
          <span key={i} className={`block h-[2px] bg-white/70 ${i >= 13 ? "lg:hidden" : ""}`} style={{ marginTop: i === 0 ? 0 : 72 }} />
        ))}
      </div>
      <div className="pointer-events-none absolute left-[1165px] -top-[38px] hidden lg:block" aria-hidden="true">
        <Image src="/landing/pin-yellow.svg" alt="" width={142} height={135} className="w-[100px] rotate-[8deg]" />
      </div>
      <span className="absolute left-[1179px] top-[50px] hidden h-[50px] w-[50px] rounded-full bg-white lg:block" aria-hidden="true" />

      <div className="relative flex flex-col items-center gap-16 max-sm:gap-0 lg:block">
        <div className="flex w-full max-w-[640px] flex-col items-center max-sm:contents sm:flex-row sm:justify-center lg:contents">
          <StickyNote color="#F9EC84" rotate={9.5} width={292} pin="green" art={{ src: "plant", w: 89, h: 122, className: "w-[80px]" }} stack={{ index: 0 }} title="Profit" body="What you build stays valuable, not just downloadable." className="max-sm:scale-[0.92] lg:absolute lg:left-[328px] lg:top-[118px]" />
          <StickyNote color="#EBD2F9" rotate={-9.5} width={314} pin="blue" art={{ src: "music", w: 132, h: 142, className: "w-[132px] -mt-[22px]" }} stack={{ index: 1 }} title="Order" body="Reservations turn a crowd into a queue." className="max-sm:scale-[0.92] sm:-ml-6 lg:absolute lg:left-[647px] lg:top-[116px] lg:ml-0" />
        </div>

        <h2 className="relative text-center text-[44px] font-bold leading-[1.1] text-white max-sm:order-first max-sm:mb-14 lg:absolute lg:inset-x-0 lg:top-[514px] lg:text-[64px] lg:leading-[73px]">
          Benefits that
          <br />
          Huddle{" "}
          <span className="relative inline-block">
            <svg className="absolute -bottom-[16px] -left-[6px] h-[26px] w-[calc(100%+30px)]" viewBox="0 0 300 26" fill="none" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <filter id="dry-brush" x="-5%" y="-50%" width="110%" height="200%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
                  <feDisplacementMap in="SourceGraphic" scale="3" />
                </filter>
              </defs>
              <g filter="url(#dry-brush)" stroke="#FEF16C" strokeLinecap="round">
                <path d="M4 13c40-9 90-8 140-3s90 9 150 1" strokeWidth="5" />
                <path d="M12 17c50-5 110-2 160 1 40 2 80 0 118-4" strokeWidth="3" opacity="0.8" />
                <path d="M20 10c60-4 120 0 170 3" strokeWidth="2" opacity="0.6" />
              </g>
            </svg>
            <span className="relative">provides.</span>
          </span>
        </h2>

        <div className="flex w-full max-w-[640px] flex-col items-center max-sm:contents sm:flex-row sm:justify-center lg:contents">
          <StickyNote color="#ABE69E" rotate={-9.7} width={307} art={{ src: "laptop", w: 179, h: 162, className: "w-[160px] -mt-[22px]" }} stack={{ index: 2 }} title="Continuity" body="Forum Access keeps your event's community connected." className="max-sm:scale-[0.92] lg:absolute lg:left-[330px] lg:top-[752px]" />
          <StickyNote color="#BEE1E3" rotate={10} width={306} art={{ src: "hands", w: 180, h: 103, className: "w-[160px] mt-[24px]" }} stack={{ index: 3, last: true }} title="Proof" body="A Certificate turns attendance into an achievement." className="max-sm:scale-[0.92] sm:-ml-6 lg:absolute lg:left-[650px] lg:top-[746px] lg:ml-0" />
        </div>
      </div>
      </div>
    </section>
  );
}

/** The hand-drawn vertical line between steps. */
function StepLine({ after = 96 }: { after?: number }) {
  return (
    <svg
      className="mx-auto my-[48px] block h-[88px] w-[6px] lg:mb-[var(--after)] lg:mt-[140px] lg:h-[190px]"
      style={{ ["--after" as string]: `${after}px` }}
      viewBox="0 0 6 190"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 1c.6 40 .2 90 .4 140 .1 20-.3 35-.4 48" stroke="#1A1A1A" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** The two "///" doodles beside step 01, traced from the design. */
function SparkRight({ className }: { className: string }) {
  return (
    <svg className={className} width="100" height="105" viewBox="0 0 100 105" fill="none" aria-hidden="true">
      <g stroke="#1A1A1A" strokeWidth="4.2" strokeLinejoin="round">
        <path d="M13 15l19-2-17 49z" />
        <path d="M52 22l28 6-47 54z" />
        <path d="M77 60l13 15-38 18z" />
      </g>
    </svg>
  );
}

function SparkLeft({ className }: { className: string }) {
  return (
    <svg className={className} width="85" height="90" viewBox="0 0 85 90" fill="none" aria-hidden="true">
      <g stroke="#1A1A1A" strokeWidth="4.2" strokeLinejoin="round">
        <path d="M20 49l20 23-32-12z" />
        <path d="M17 22l25-5 11 58z" />
        <path d="M58 10l14 3-4 37z" />
      </g>
    </svg>
  );
}

function Step({ n, title, body, bodyWidth = 840, children }: { n: string; title: string; body: React.ReactNode; bodyWidth?: number; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full border-2 border-ink bg-huddle-yellow text-[42px] lg:h-[98px] lg:w-[98px] lg:text-[54px] font-light leading-none tracking-[-0.02em]">{n}</span>
      <h3 className="mt-[28px] text-balance text-[30px] font-medium leading-[1.1] sm:text-[38px] lg:mt-[56px] lg:text-[48px]">{title}</h3>
      <p className="mt-[14px] text-pretty text-[19px] leading-[1.4] sm:text-[24px] lg:mt-[26px] lg:text-[36px] lg:leading-[1.35]" style={{ maxWidth: bodyWidth }}>
        {body}
      </p>
      {children && <div className="mt-[48px] w-full lg:mt-[140px]">{children}</div>}
    </div>
  );
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DATES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 25, 28, 29, 30, 1, 2, 3, 4, 5];

function HowItWorks() {
  const field = "flex h-[61px] w-full items-center rounded-[14px] border border-ink px-[20px] text-[16px] text-[#737373]";
  return (
    <section id="how" className="relative mx-auto max-w-[1280px] scroll-mt-28 px-5 pt-[160px] lg:pt-[282px]">
      <h2 className="text-center font-serif text-[52px] leading-none lg:text-[72px]">How It Works</h2>
      <div className="relative mt-[56px] lg:mt-[97px]">
        <SparkLeft className="absolute left-[100px] top-[181px] hidden lg:block" />
        <SparkRight className="absolute left-[1045px] top-[46px] hidden lg:block" />
        <Step n="01" title="Create your organisation" body="Set up in minutes. No sales calls, no setup fees.">
          <div className="mx-auto max-w-[550px] space-y-[26px] text-left" aria-hidden="true">
            <div className={field}>Organization name</div>
            <div className={field}>Organization email</div>
          </div>
          <div className="mx-auto mt-[26px] max-w-[550px] text-left">
            <Link href="/login" className="inline-flex h-[56px] w-[170px] items-center justify-center rounded-[12px] bg-huddle-yellow text-[22px] font-medium shadow-[0_2px_6px_rgba(26,26,26,0.12)] transition-[transform,background-color] duration-200 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ink/25 [@media(hover:hover)]:hover:bg-huddle-yellow-deep">
              Create Org.
            </Link>
          </div>
        </Step>
      </div>
      <StepLine after={101} />
      <Step n="02" title="Build your event" body="Add the details. Pick a date. You're live.">
        <div className="mx-auto w-fit font-medium tabular-nums" aria-hidden="true">
          <div className="flex justify-center gap-3 sm:gap-[37px]">
            <span className="flex h-[56px] w-[190px] items-center justify-between rounded-[10px] border border-[#E2E2E2] px-4 text-[22px] sm:h-[76px] sm:w-[270px] sm:px-[26px] sm:text-[32px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              Select date
              <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                <path d="M2 2l8 8 8-8" stroke="#1A1A1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="flex h-[56px] w-[136px] items-center justify-center rounded-[10px] border border-[#E2E2E2] text-[22px] sm:h-[76px] sm:w-[198px] sm:text-[32px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">10:30:00</span>
          </div>
          <div className="mx-auto mt-[40px] grid w-fit grid-cols-7 gap-x-[0.5px] text-center">
            {DAYS.map((d) => (
              <span key={d} className="h-[48px] w-[46px] text-[18px] leading-[48px] text-[#848484] sm:h-[64px] sm:w-[65.5px] sm:text-[26px] sm:leading-[64px]">
                {d}
              </span>
            ))}
            {DATES.map((d, i) => (
              <span
                key={i}
                className={`my-[5px] flex h-[46px] w-[46px] items-center justify-center rounded-[10px] text-[20px] sm:my-[8.5px] sm:h-[65px] sm:w-[65.5px] sm:rounded-[12px] sm:text-[30px] ${i === 12 ? "bg-huddle-yellow" : ""} ${i >= 30 ? "text-[#848484]" : ""}`}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </Step>
      <StepLine after={88} />
      <Step n="03" title="Attach what you need" bodyWidth={600} body="Content Protection. Number Picker. Forum Access. Certificates. Only what fits.">
        <div className="mx-auto max-w-[450px] space-y-[23px] text-left" aria-hidden="true">
          {[
            { label: "Number Picker", selected: true },
            { label: "Content Protection", selected: false },
          ].map((f) => (
            <div key={f.label} className="flex h-[72px] items-center gap-4 rounded-[20px] border-[1.5px] border-ink bg-huddle-yellow pl-4 pr-5 sm:h-[82px] sm:gap-[30px] sm:pl-[23px] sm:pr-[32px]">
              <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white">
                <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                  <path d="M2 8l5.5 6L18 2" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                {f.selected && <span className="block text-[9px] uppercase leading-[11px]">Selected</span>}
                <span className="block text-[20px] leading-[26px] sm:text-[24px] sm:leading-[28px]">{f.label}</span>
              </span>
              {f.selected && (
                <span className="ml-auto grid grid-cols-2 gap-[3px]">
                  {[0, 1, 2, 3].map((k) => (
                    <span key={k} className="h-[17px] w-[17px] rounded-[3px] bg-ink" />
                  ))}
                </span>
              )}
            </div>
          ))}
        </div>
      </Step>
      <StepLine after={173} />
      <Step n="04" title="Bring your people in" body="They register, reserve, engage — all in one place.">
        <Image src="/landing/monitor.svg" alt="" width={318} height={322} className="mx-auto w-[260px] lg:w-[318px]" />
      </Step>
      <StepLine after={98} />
      <Step n="05" title="Earn from what you built" body="Gate it, price it, get paid. You keep the majority.">
        <Image src="/landing/coins.svg" alt="" width={427} height={278} className="mx-auto w-[320px] lg:w-[411px]" />
      </Step>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-[1280px] scroll-mt-28 px-5 pb-[96px] pt-[112px] lg:pb-[140px] lg:pt-[200px]">
      <div className="mx-auto max-w-[640px] rounded-[56px] bg-huddle-yellow px-8 py-14 text-center">
        <h2 className="font-serif text-[52px] leading-none lg:text-[64px]">Free to start.</h2>
        <p className="mx-auto mt-6 max-w-[440px] text-[19px] leading-[1.42]">
          No monthly fee. When you earn, Huddle keeps 5% and your share lands in your bank account. Pro and Scale plans with lower fees are
          coming soon.
        </p>
        <Link href="/login" className={`${pill} mt-9 h-[50px] bg-ink px-7 text-[19px] text-white [@media(hover:hover)]:hover:bg-ink/85`}>
          Create your organisation
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-[1280px] rounded-t-[56px] bg-ink px-6 py-12 text-center text-[#FFFBE6] lg:rounded-t-[110px]">
      <p className="flex items-center justify-center gap-[10px] text-[30px] font-semibold">
        <LogoMark className="h-[30px] w-auto" />
        Huddle
      </p>
      <p className="mt-3 text-[17px] text-white/80">Where organisations bring their people together.</p>
      <p className="mt-6 text-[14px] text-white/60">Built by The Watchers Channel &amp; Vivant Enterprises · Huddle © 2026</p>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="landing-fit flex-1 bg-white text-ink selection:bg-huddle-yellow selection:text-ink [&_img]:select-none">
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
