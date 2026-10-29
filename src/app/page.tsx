import Link from "next/link";
import { BellRing, CalendarCheck2, CloudOff, HandHeart, Lock, MoonStar, Plane, SlidersHorizontal } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { HeroPreview } from "@/components/landing/hero-preview";
import { Reveal } from "@/components/landing/reveal";

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "Times that match your mosque",
    body: "Calculated for exactly where you are with twelve recognised methods. Nudge any prayer by a few minutes, or pin it to your jamāʿah time.",
  },
  {
    icon: CalendarCheck2,
    title: "One tap. Then back to life.",
    body: "Tap a prayer to mark it on time. Hold for the details — late or made up, alone or in congregation, the sunnah before and after.",
  },
  {
    icon: HandHeart,
    title: "Qaḍāʾ, accounted for",
    body: "Set the prayers you owe and make them up one at a time. Anything marked missed is added automatically, so nothing is forgotten.",
  },
  {
    icon: MoonStar,
    title: "Room for the night prayer",
    body: "Tahajjud has its own window in the last third of the night and its own streak — encouraged, never counted against you.",
  },
  {
    icon: BellRing,
    title: "Reminders that respect you",
    body: "A note when each prayer begins, and a gentle nudge only if it slips by unmarked. Silent on the days you're excused.",
  },
  {
    icon: Plane,
    title: "Made for real life",
    body: "Travel mode shortens and combines prayers. Excused days for ḥaiḍ and nifās pause everything and keep your streak intact.",
  },
  {
    icon: CloudOff,
    title: "Works without a signal",
    body: "Install it to your home screen. Mark prayers offline in the masjid basement — everything syncs the moment you're back.",
  },
  {
    icon: Lock,
    title: "Private by design",
    body: "No feeds, no leaderboards, no sharing. Your prayers are between you and your Lord; this is only a notebook.",
  },
];

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex h-16 max-w-[1160px] items-center justify-between px-5 pt-[env(safe-area-inset-top)] sm:h-20 sm:px-8">
        <Link href="/" aria-label="Deen home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/sign-in" className="rounded-xl px-3 py-2 text-[15px] text-ink-2 transition-colors hover:text-ink">
            Sign in
          </Link>
          <ButtonLink href="/sign-up" size="sm" className="rounded-full px-4">
            Get started
          </ButtonLink>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1160px] items-center gap-14 px-5 pt-10 pb-20 sm:px-8 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-20 lg:pb-28">
          <Reveal>
            <p lang="ar" dir="rtl" className="w-fit font-arabic text-[22px] text-accent sm:text-[24px]">
              حَافِظُوا عَلَى الصَّلَوَاتِ
            </p>
            <h1 className="mt-4 font-serif text-[52px] leading-[0.98] tracking-[-0.02em] text-balance sm:text-[72px] lg:text-[84px]">
              Guard your prayers, <em className="text-muted">gently.</em>
            </h1>
            <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
              Deen is a calm, private companion for the five daily prayers and Tahajjud — accurate times, one-tap logging, and honest
              reflection on how you&apos;re keeping them.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/sign-up" size="lg" className="rounded-full px-7">
                Start for free
              </ButtonLink>
              <ButtonLink href="/sign-in" variant="ghost" size="lg" className="rounded-full">
                I already have an account
              </ButtonLink>
            </div>
            <p className="mt-6 text-[13px] text-muted">Free · No ads · Works on any phone or computer</p>
          </Reveal>

          <HeroPreview />
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-[1160px] px-5 py-20 sm:px-8 sm:py-28">
            <Reveal className="max-w-[640px]">
              <h2 className="font-serif text-[40px] leading-[1.05] tracking-tight sm:text-[52px]">Built around the way you actually pray.</h2>
              <p className="mt-4 text-[17px] leading-relaxed text-muted">
                Every detail is considered, then kept out of your way. Open it, mark the prayer, close it.
              </p>
            </Reveal>
            <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, body }, i) => (
                <Reveal as="li" key={title} delay={(i % 4) * 0.06}>
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <Icon className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-[17px] font-medium tracking-tight">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-[900px] px-5 py-24 text-center sm:px-8 sm:py-32">
          <Reveal>
            <p lang="ar" dir="rtl" className="font-arabic text-[30px] leading-[1.8] text-ink sm:text-[40px]">
              حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ
            </p>
            <p className="mx-auto mt-6 max-w-[600px] font-serif text-[24px] leading-snug text-ink-2 italic sm:text-[30px]">
              “Guard strictly the prayers, and the middle prayer, and stand before Allah in devout obedience.”
            </p>
            <p className="mt-4 text-[14px] text-muted">Al-Baqarah · 2:238</p>
          </Reveal>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-28">
          <Reveal className="mx-auto max-w-[1160px] overflow-hidden rounded-[32px] bg-accent px-6 py-16 text-center text-accent-ink sm:px-12 sm:py-20">
            <h2 className="font-serif text-[40px] leading-[1.05] tracking-tight sm:text-[56px]">Begin with the next prayer.</h2>
            <p className="mx-auto mt-4 max-w-[460px] text-[17px] opacity-80">Set up takes a minute. Your first entry takes a tap.</p>
            <Link
              href="/sign-up"
              className="press mt-9 inline-flex h-12 items-center rounded-full bg-accent-ink px-7 text-[15px] font-medium text-accent transition-opacity hover:opacity-90"
            >
              Create your account
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1160px] flex-col items-center justify-between gap-4 px-5 py-8 text-[13px] text-muted sm:flex-row sm:px-8">
          <Logo className="scale-90" />
          <p>Made with care for the ummah.</p>
        </div>
      </footer>
    </div>
  );
}
