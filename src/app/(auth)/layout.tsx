import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-accent text-accent-ink lg:flex lg:flex-col lg:justify-between lg:p-14">
        <Link href="/" className="relative z-10 [&_rect]:fill-accent-ink [&_path]:stroke-accent">
          <Logo />
        </Link>
        <ArchPattern />
        <figure className="relative z-10 max-w-md">
          <blockquote>
            <p lang="ar" dir="rtl" className="font-arabic text-[34px] leading-[1.7] opacity-95">
              حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ
            </p>
            <p className="mt-4 font-serif text-[28px] leading-snug italic">
              “Guard strictly the prayers, and the middle prayer.”
            </p>
          </blockquote>
          <figcaption className="mt-3 text-sm opacity-70">Al-Baqarah · 2:238</figcaption>
        </figure>
      </aside>
      <main className="flex flex-col px-5 pt-[max(env(safe-area-inset-top),24px)] pb-10 sm:px-10">
        <Link href="/" className="mb-10 self-start lg:hidden">
          <Logo />
        </Link>
        <div className="m-auto w-full max-w-[380px]">{children}</div>
      </main>
    </div>
  );
}

function ArchPattern() {
  return (
    <svg className="pointer-events-none absolute -right-24 -bottom-10 h-[120%] opacity-[0.09]" viewBox="0 0 400 600" fill="none" aria-hidden>
      {Array.from({ length: 7 }).map((_, i) => {
        const inset = i * 26;
        return (
          <path
            key={i}
            d={`M${40 + inset} 600V${260 + inset * 0.6}c0-${90 - inset * 0.4} ${70 - inset * 0.3}-${150 - inset * 0.6} ${160 - inset}-${200 - inset * 0.9} ${90 - inset * 0.7} ${50 - inset * 0.3} ${160 - inset} ${110 - inset * 0.2} ${160 - inset} ${200 - inset * 0.5}V600`}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}
