import Link from "next/link";
import { PLAN_SOLO } from "@/lib/marketing/plans";

/** Oferta dla pojedynczego agenta, pokazywana pod planami biur. */
export function SoloBaner({ en = false }: { en?: boolean }) {
  if (en) return null;
  return (
    <div className="solo-baner mx-auto mt-8 grid max-w-[1100px] items-center gap-6 rounded-[28px] bg-[#0b1220] p-6 text-white md:grid-cols-[minmax(0,1fr)_auto] md:p-8">
      <div>
        <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#6ee7c8]">Pracujesz sam?</p>
        <p className="mt-2 font-[family-name:var(--font-sora)] text-2xl font-semibold tracking-tight md:text-3xl">
          Plan Solo: {PLAN_SOLO.price} zł netto miesięcznie
        </p>
        <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-[15px] text-[#c3cddb] sm:grid-cols-2">
          {PLAN_SOLO.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-[#6ee7c8]">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <Link href="/signup?plan=solo" className="inline-flex h-[52px] items-center justify-center rounded-full bg-[#10b981] px-7 font-semibold text-[#04170f] transition hover:bg-[#6ee7c8]">
        Wypróbuj 7 dni za darmo
      </Link>
    </div>
  );
}
