import Link from "next/link";

/**
 * 404 wewnątrz aplikacji.
 *
 * Bez tego pliku brakujący zasób w panelu wyrzucał na marketingową stronę
 * błędu, z nawigacją „Cennik" i „Umów rozmowę". Zdarzało się to choćby po
 * usunięciu agenta, kiedy jego strona renderowała się jeszcze raz.
 */
const SKROTY = [
  { href: "/app", label: "Pulpit", opis: "Plan dnia i zadania" },
  { href: "/app/klienci", label: "Klienci", opis: "Baza kontaktów" },
  { href: "/app/nieruchomosci", label: "Nieruchomości", opis: "Oferty biura" },
  { href: "/app/zespol", label: "Zespół", opis: "Ludzie i wyniki" },
];

export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <p className="text-sm font-medium uppercase tracking-wider text-slate-400">Błąd 404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        Nie ma takiej strony
      </h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        Element mógł zostać usunięty albo adres jest nieaktualny. Nic się nie
        zepsuło, po prostu nie ma tu czego pokazać.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {SKROTY.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
          >
            <p className="font-medium text-slate-900">{s.label}</p>
            <p className="mt-0.5 text-sm text-slate-500">{s.opis}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
