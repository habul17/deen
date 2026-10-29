import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-10">
      <Link href="/" className="self-start">
        <Logo />
      </Link>
      <div className="my-auto w-full py-12">{children}</div>
      <figure className="text-center text-ink-soft">
        <p lang="ar" dir="rtl" className="font-arabic text-[1.125rem] leading-[1.8]">
          حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ
        </p>
        <figcaption className="mt-1 text-[0.75rem]">Guard strictly the prayers, and the middle prayer · Al-Baqarah 2:238</figcaption>
      </figure>
    </main>
  );
}
