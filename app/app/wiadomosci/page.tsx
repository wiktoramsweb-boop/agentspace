import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { watekKlienta, watkiKlientow } from "@/lib/wiadomosci-klientow";
import { PageHeader, Card } from "../components/ui";
import { Rozmowa } from "./rozmowa";

export const metadata = { title: "Wiadomości od klientów" };
export const dynamic = "force-dynamic";

const kiedy = (iso: string) => {
  const d = new Date(iso);
  const dzis = new Date().toDateString() === d.toDateString();
  return new Intl.DateTimeFormat("pl-PL", dzis ? { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" } : { day: "numeric", month: "short", timeZone: "Europe/Warsaw" }).format(d);
};

/**
 * Skrzynka rozmów z klientami z portalu. Na komputerze lista obok rozmowy,
 * na telefonie najpierw lista, a po wyborze sama rozmowa.
 */
export default async function WiadomosciKlientow({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const user = await requireUser();
  const { w } = await searchParams;
  const { ready, watki } = await watkiKlientow(user);
  const wybrany = w ? await watekKlienta(user, w) : null;

  return (
    <>
      <PageHeader title="Wiadomości od klientów" subtitle="Rozmowy z klientami, którzy mają dostęp do portalu. Odpowiedź od razu trafia na ich telefon." />

      {!ready ? (
        <Card>
          <p className="text-sm text-slate-500">Wiadomości wymagają aktualizacji bazy (lib/SETUP-v47-portal-rozbudowa.sql).</p>
        </Card>
      ) : watki.length === 0 && !wybrany ? (
        <Card>
          <p className="text-center text-sm text-slate-500">
            Nie ma jeszcze żadnej rozmowy. Klient napisze z zakładki „Wiadomości” w swoim portalu, a Ty dostaniesz powiadomienie.
            <br />
            Portal włączysz na karcie klienta.
          </p>
        </Card>
      ) : (
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[320px_1fr]">
          <ul className={`divide-y divide-slate-100 border-slate-200 md:border-r ${wybrany ? "hidden md:block" : ""}`}>
            {watki.map((t) => (
              <li key={t.accessId}>
                <Link
                  href={`/app/wiadomosci?w=${t.accessId}`}
                  replace={Boolean(wybrany)}
                  scroll={false}
                  className={`flex gap-3 px-4 py-3.5 transition hover:bg-slate-50 ${t.accessId === w ? "bg-emerald-50/60" : ""}`}
                >
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-sm font-bold text-white">
                    {t.klient.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${t.nieprzeczytane ? "font-bold text-slate-900" : "font-medium text-slate-800"}`}>{t.klient}</span>
                      {t.ostatnia && <span className="flex-shrink-0 text-[11px] text-slate-400">{kiedy(t.ostatnia.created_at)}</span>}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-[13px] ${t.nieprzeczytane ? "text-slate-700" : "text-slate-500"}`}>
                        {t.ostatnia?.autor === "agent" ? "Ty: " : ""}
                        {t.ostatnia?.tresc}
                      </span>
                      {t.nieprzeczytane > 0 && (
                        <span className="flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[11px] font-bold text-white">
                          {t.nieprzeczytane}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className={wybrany ? "" : "hidden md:block"}>
            {wybrany && w ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                  <Link href="/app/wiadomosci" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Wróć do listy">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </Link>
                  <p className="min-w-0 flex-1 truncate font-semibold text-slate-900">{wybrany.klient}</p>
                  <Link href={`/app/klienci/${wybrany.clientId}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Karta klienta
                  </Link>
                </div>
                <Rozmowa accessId={w} klient={wybrany.klient} aktywny={wybrany.aktywny} lista={wybrany.lista} />
              </>
            ) : (
              <p className="flex h-full min-h-[40vh] items-center justify-center p-8 text-sm text-slate-400">Wybierz rozmowę z listy.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
