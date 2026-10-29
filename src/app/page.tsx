import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { HeroPreview } from "@/components/landing/hero-preview";
import { Reveal } from "@/components/landing/reveal";

const FEATURES = [
  {
    title: "Times that match your mosque",
    body: "Calculated for exactly where you are with twelve recognised methods. Nudge any prayer by a few minutes, or pin it to your jamāʿah time.",
  },
  {
    title: "One tap, then back to life",
    body: "Tap a prayer to mark it. Hold it for the details: late or made up, alone or in congregation, the sunnah before and after.",
  },
  {
    title: "A sky that keeps time",
    body: "The screen follows the real sky where you are, from the blue before Fajr to the dark after Isha. You can tell the hour at a glance.",
  },
  {
    title: "Qaḍāʾ, accounted for",
    body: "Set the prayers you owe and make them up one at a time. Anything marked missed is added for you, so nothing is forgotten.",
  },
  {
    title: "Made for real life",
    body: "Travel mode shortens and combines prayers. Excused days pause everything and keep your streak intact. Tahajjud is counted, never held against you.",
  },
  {
    title: "Quiet reminders, even offline",
    body: "A note when each prayer begins and a gentle nudge only if it slips by. Install it to your home screen and it works without a signal.",
  },
  {
    title: "Private by design",
    body: "No feeds, no leaderboards, no sharing. Your prayers are between you and your Lord; this is only a notebook.",
  },
];

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-6 pt-[env(safe-area-inset-top)] sm:h-20 sm:px-8">
        <Link href="/" aria-label="Deen home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/sign-in" className="rounded-full px-3 py-2 text-[0.9375rem] text-ink-soft transition-colors hover:text-ink">
            Sign in
          </Link>
          <ButtonLink href="/sign-up" size="sm">
            Get started
          </ButtonLink>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1080px] items-center gap-16 px-6 pt-12 pb-24 sm:px-8 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:pt-20 lg:pb-32">
          <Reveal>
            <h1 className="display text-[clamp(3.25rem,13vw,5.75rem)] leading-[0.92] font-semibold tracking-[-0.045em] text-balance">
              Guard your prayers, gently.
            </h1>
            <p className="mt-6 max-w-[30rem] text-[1.125rem] leading-relaxed text-ink-soft">
              A calm, private place to keep the five daily prayers and Tahajjud. Accurate times, one tap to mark, and nothing else in the
              way.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="/sign-up" size="lg" className="px-7">
                Start for free
              </ButtonLink>
              <ButtonLink href="/sign-in" variant="ghost" size="lg">
                I have an account
              </ButtonLink>
            </div>
            <p className="mt-6 text-[0.8125rem] text-ink-soft">Free · No ads · Works on any phone or computer</p>
          </Reveal>

          <HeroPreview />
        </section>

        <section className="mx-auto max-w-[1080px] px-6 pb-24 sm:px-8 sm:pb-32">
          <Reveal className="max-w-[36rem]">
            <h2 className="display text-[clamp(2.25rem,8vw,3.5rem)] leading-[0.98] font-semibold">Built around the way you actually pray.</h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink-soft">Open it, mark the prayer, close it. Everything else stays out of your way.</p>
          </Reveal>
          <ol className="mt-12 divide-y divide-line border-y border-line">
            {FEATURES.map(({ title, body }, i) => (
              <Reveal as="li" key={title} className="grid gap-2 py-6 sm:grid-cols-[3rem_16rem_1fr] sm:gap-6">
                <span className="tnum hidden text-[0.875rem] text-ink-soft sm:block">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-[1.0625rem] font-semibold">{title}</h3>
                <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{body}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[760px] px-6 pb-24 text-center sm:px-8 sm:pb-32">
          <Reveal>
            <p lang="ar" dir="rtl" className="font-arabic text-[1.75rem] leading-[1.8] sm:text-[2.25rem]">
              حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ
            </p>
            <p className="display mx-auto mt-6 max-w-[34rem] text-[1.5rem] leading-snug font-medium tracking-[-0.02em] sm:text-[1.875rem]">
              “Guard strictly the prayers, and the middle prayer, and stand before Allah in devout obedience.”
            </p>
            <p className="mt-4 text-[0.875rem] text-ink-soft">Al-Baqarah 2:238</p>
          </Reveal>
        </section>

        <section className="mx-auto max-w-[1080px] px-6 pb-24 text-center sm:px-8 sm:pb-32">
          <Reveal>
            <h2 className="display text-[clamp(2.5rem,10vw,4.5rem)] leading-[0.95] font-semibold">Begin with the next prayer.</h2>
            <p className="mx-auto mt-4 max-w-[26rem] text-[1.0625rem] text-ink-soft">Setting up takes a minute. Your first entry takes a tap.</p>
            <ButtonLink href="/sign-up" size="lg" className="mt-9 px-7">
              Create your account
            </ButtonLink>
          </Reveal>
        </section>
      </main>

      <footer className="mx-auto max-w-[1080px] px-6 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-line py-8 text-[0.8125rem] text-ink-soft sm:flex-row">
          <Logo className="scale-90" />
          <p>Made with care for the ummah.</p>
        </div>
      </footer>
    </div>
  );
}
