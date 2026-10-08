import Link from "next/link";

/**
 * Pasek zakładek w karcie klienta, nieruchomości czy poszukiwania.
 *
 * Zakładkę trzymamy w adresie (`?z=`), a nie w stanie komponentu: dzięki temu
 * da się wysłać komuś link prosto do dokumentów albo do kodu QR, a strzałka
 * wstecz wraca tam, gdzie agent był.
 */

export type Zakladka = { key: string; label: string; ikona: keyof typeof SCIEZKI };

export const SCIEZKI = {
  osoba: "M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0A17.9 17.9 0 0 1 12 21.75c-2.7 0-5.26-.6-7.5-1.65Z",
  dom: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
  lupa: "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z",
  blyskawica: "m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  teczka: "M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z",
  koperta: "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 9.41a2.25 2.25 0 0 1-1.07-1.916V6.75",
  telefon: "M10.5 1.5h3m-9 3.75a2.25 2.25 0 0 1 2.25-2.25h10.5a2.25 2.25 0 0 1 2.25 2.25v13.5a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V5.25Z",
  podpis: "M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10",
  notatka: "M8.25 6.75h7.5M8.25 11.25h7.5M8.25 15.75h4.5M5.25 3.75h13.5a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5Z",
} as const;

export function Zakladki({
  zakladki,
  active,
  adres,
  liczniki = {},
  etykieta,
}: {
  zakladki: readonly Zakladka[];
  active: string;
  /** Adres zakładki. Pierwsza pozycja zwykle bez parametru. */
  adres: (key: string) => string;
  /** Liczba pozycji przy nazwie: od razu widać, gdzie coś jest, a gdzie pusto. */
  liczniki?: Record<string, number | undefined>;
  etykieta: string;
}) {
  return (
    <nav
      aria-label={etykieta}
      className="mb-6 -mx-5 overflow-x-auto border-b border-slate-200 px-5 md:mx-0 md:px-0"
    >
      <ul className="flex min-w-max items-end gap-1">
        {zakladki.map((t) => {
          const on = t.key === active;
          const n = liczniki[t.key];
          return (
            <li key={t.key}>
              <Link
                href={adres(t.key)}
                scroll={false}
                aria-current={on ? "page" : undefined}
                className={`relative flex items-center gap-2 whitespace-nowrap rounded-t-xl px-3.5 py-3 text-sm font-medium transition sm:px-4 ${
                  on ? "text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <svg
                  className={`h-[18px] w-[18px] ${on ? "text-emerald-600" : "text-slate-400"}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={SCIEZKI[t.ikona]} />
                </svg>
                {t.label}
                {n != null && n > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                      on ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {n}
                  </span>
                )}
                {on && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-emerald-500"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
