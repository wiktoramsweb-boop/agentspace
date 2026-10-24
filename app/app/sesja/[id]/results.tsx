import { Wstecz } from "@/app/app/components/wstecz";
import Link from "next/link";
import type { SessionWithScore } from "@/lib/data";
import type { Analiza, KategoriaOceny, Moment } from "@/lib/ai/coach";
import { formatCzasu, indeksCytatu, metrykiRozmowy, ocenaUdzialu } from "@/lib/coach/metryki";
import { WSZYSTKIE_LEKCJE, lekcja as znajdzLekcje, wynikSesji } from "@/lib/coach/sciezka";
import { kartaRozmowy } from "@/lib/karta-rozmowy";
import { bezZnacznikaRozlaczenia, klientSieRozlaczyl } from "@/lib/coach/realizm";
import { RescoreButton } from "./rescore-button";
import { Odtwarzacz, type ZnacznikNagrania } from "./odtwarzacz";

const NAZWY: Record<KategoriaOceny["klucz"], string> = {
  otwarcie: "Otwarcie i powód telefonu",
  kwalifikacja: "Pytania i rozpoznanie klienta",
  obiekcje: "Obiekcje i opór",
  zamkniecie: "Następny krok",
};

/** Starsze oceny (skala 1-10 bez analizy) pokazujemy w tym samym układzie. */
function analizaZeStarej(score: NonNullable<SessionWithScore["score"]>): Analiza {
  const k = (klucz: KategoriaOceny["klucz"], v: number, max: number): KategoriaOceny => ({ klucz, punkty: Math.round((v / 10) * max), max, uzasadnienie: "" });
  const kategorie = [k("otwarcie", score.opening, 20), k("kwalifikacja", score.qualification, 25), k("obiekcje", score.objection_handling, 30), k("zamkniecie", score.closing, 25)];
  return {
    wersja: 2,
    wynik: score.overall * 10,
    naglowek: score.summary.split(". ")[0] ?? "",
    cel: { osiagniety: score.closing >= 7, opis: "" },
    kategorie,
    obiekcje: [],
    nastepnym: score.suggestions,
  };
}

function kolor(wynik: number, prog: number) {
  if (wynik >= Math.max(prog, 75)) return { tekst: "text-emerald-600", tlo: "bg-emerald-500", miekkie: "bg-emerald-50", ring: "#10b981" };
  if (wynik >= prog) return { tekst: "text-teal-600", tlo: "bg-teal-500", miekkie: "bg-teal-50", ring: "#14b8a6" };
  if (wynik >= prog * 0.6) return { tekst: "text-amber-600", tlo: "bg-amber-500", miekkie: "bg-amber-50", ring: "#f59e0b" };
  return { tekst: "text-rose-600", tlo: "bg-rose-500", miekkie: "bg-rose-50", ring: "#f43f5e" };
}

export function SessionResults({
  session,
  slug = null,
  brief = "",
  backHref = "/app/historia",
  backLabel = "← Historia sesji",
  showTrainAgain = true,
}: {
  session: SessionWithScore;
  /** Slug scenariusza: do przycisku „Powtórz scenariusz”. */
  slug?: string | null;
  /** Opis scenariusza: z niego bierzemy imię klienta do statystyk. */
  brief?: string;
  backHref?: string;
  backLabel?: string;
  showTrainAgain?: boolean;
}) {
  const score = session.score;
  const ctx = session.context ?? null;
  const transkrypt = session.transcript ?? [];
  const karta = kartaRozmowy(brief);
  const lekcja = znajdzLekcje(ctx?.lekcja);
  const prog = lekcja?.prog ?? 60;

  if (!score) {
    return (
      <>
        <Wstecz href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
          {backLabel}
        </Wstecz>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">{session.scenario_title ?? "Sesja treningowa"}</h1>
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6">
          {!transkrypt.some((m) => m.role === "agent") ? (
            <p className="text-sm text-slate-500">W rozmowie nie padło żadne Twoje zdanie, więc nie ma czego oceniać.</p>
          ) : showTrainAgain ? (
            <RescoreButton sessionId={session.id} />
          ) : (
            <p className="text-sm text-slate-500">Ta rozmowa nie ma jeszcze oceny. Agent zobaczy ją po otwarciu rozmowy.</p>
          )}
        </div>
      </>
    );
  }

  const a: Analiza = ctx?.analiza ?? analizaZeStarej(score);
  const wynik = wynikSesji(ctx?.analiza?.wynik, score.overall) ?? 0;
  const k = kolor(wynik, prog);
  const zaliczona = wynik >= prog;
  const metryki = metrykiRozmowy(transkrypt, karta.kto.replace(/^Pan[i]?\s+/, ""));
  const udzial = ocenaUdzialu(metryki.udzialAgenta);
  const rozlaczyl = transkrypt.some((m) => m.role === "client" && klientSieRozlaczyl(m.content));
  const czas = ctx?.glos?.sekundy ?? metryki.czasS;
  const maNagranie = Boolean(ctx?.glos?.rozmowa);
  const momenty: (Moment & { t: number | null; tura: number | null })[] = (score.moments ?? []).map((m) => {
    const i = indeksCytatu(transkrypt, m.cytat);
    return { ...m, t: i !== null ? (transkrypt[i]?.t ?? null) : null, tura: i !== null ? i + 1 : null };
  });
  const znaczniki: ZnacznikNagrania[] = momenty.filter((m) => m.t !== null).map((m) => ({ t: m.t as number, tytul: m.tytul || m.komentarz.slice(0, 40), dobrze: m.ocena === "dobrze" }));
  const nastepna = lekcja && zaliczona ? WSZYSTKIE_LEKCJE[WSZYSTKIE_LEKCJE.findIndex((l) => l.id === lekcja.id) + 1] : null;
  const powtorz = slug ? `/app/trening/${slug}${lekcja ? `?lekcja=${lekcja.id}` : ""}` : "/app/trening";
  const obiekcjeRozbite = a.obiekcje.filter((o) => o.rozbita).length;
  const r = 52;
  const obwod = 2 * Math.PI * r;

  return (
    <div className="pb-28">
      <Wstecz href={backHref} className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-emerald-600">
        {backLabel}
      </Wstecz>

      {/* Werdykt */}
      <section className="relative mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-60 blur-3xl ${k.miekkie}`} aria-hidden="true" />
        <div className="relative grid items-center gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
          <div className="relative grid h-36 w-36 place-items-center">
            <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="64" cy="64" r={r} fill="none" strokeWidth="12" className="stroke-slate-100" />
              <circle cx="64" cy="64" r={r} fill="none" strokeWidth="12" strokeLinecap="round" stroke={k.ring} strokeDasharray={obwod} strokeDashoffset={obwod * (1 - wynik / 100)} className="wyniki-pierscien" style={{ "--obwod": obwod } as React.CSSProperties} />
            </svg>
            <span className="text-center">
              <b className={`block text-5xl font-bold tabular-nums tracking-tight ${k.tekst}`}>{wynik}</b>
              <span className="text-xs font-medium text-slate-400">na 100</span>
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              {lekcja ? `Lekcja ${lekcja.id} · próg ${prog}` : `Próg zaliczenia ${prog}`} · {zaliczona ? "zaliczone" : "niezaliczone"}
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-slate-900 md:text-[28px]">{a.naglowek || session.scenario_title}</h1>
            <p className="mt-3 max-w-3xl leading-relaxed text-slate-600">{score.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`rounded-full px-3 py-1 ${zaliczona ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                {zaliczona ? (lekcja ? "Lekcja zaliczona" : "Powyżej progu") : `Do progu brakuje ${prog - wynik} pkt`}
              </span>
              {a.cel.opis && (
                <span className={`rounded-full px-3 py-1 ${a.cel.osiagniety ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {a.cel.osiagniety ? "Cel rozmowy osiągnięty" : "Cel rozmowy nieosiągnięty"}
                </span>
              )}
              {rozlaczyl && <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">Klient się rozłączył</span>}
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Klient: {session.personality}</span>
              {ctx?.oferta && <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">Na ofercie: {[ctx.oferta.dzielnica, ctx.oferta.miasto].filter(Boolean).join(", ") || ctx.oferta.tytul}</span>}
            </div>
            <div className="mt-5 h-2 max-w-xl overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
              <div className={`h-full rounded-full ${k.tlo} wyniki-pasek`} style={{ width: `${wynik}%` }} />
              <div className="relative -mt-2 h-2" style={{ marginLeft: `${prog}%` }}>
                <span className="absolute -top-1 h-4 w-0.5 bg-slate-900/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Liczby */}
      <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kafel etykieta="Wynik" wartosc={`${wynik}/100`} opis={`próg ${prog}`} />
        <Kafel etykieta="Rozbite obiekcje" wartosc={a.obiekcje.length ? `${obiekcjeRozbite}/${a.obiekcje.length}` : "brak"} opis={a.obiekcje.length ? "cel: wszystkie" : "klient nie zgłosił obiekcji"} />
        <Kafel etykieta="Twoje pytania" wartosc={String(metryki.pytania)} opis={`otwartych: ${metryki.pytaniaOtwarte}`} />
        <Kafel etykieta="Długość" wartosc={czas ? formatCzasu(czas) : `${metryki.turyAgenta} tur`} opis={czas ? "rozmowa głosowa" : "rozmowa pisana"} />
      </section>

      {maNagranie && (
        <section className="mb-5">
          <Odtwarzacz sesjaId={session.id} znaczniki={znaczniki} dlugosc={czas ?? null} />
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Kategorie */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Gdzie zdobyłeś i straciłeś punkty</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {a.kategorie.map((kat) => {
                const proc = kat.max ? kat.punkty / kat.max : 0;
                const barwa = proc >= 0.75 ? "bg-emerald-500" : proc >= 0.45 ? "bg-amber-400" : "bg-rose-400";
                const tekst = proc >= 0.75 ? "text-emerald-700" : proc >= 0.45 ? "text-amber-700" : "text-rose-600";
                return (
                  <li key={kat.klucz} className="py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{NAZWY[kat.klucz]}</h3>
                      <span className={`text-sm font-bold tabular-nums ${tekst}`}>
                        {kat.punkty} z {kat.max} pkt
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${barwa}`} style={{ width: `${proc * 100}%` }} />
                    </div>
                    {kat.uzasadnienie && <p className="mt-2 text-sm leading-relaxed text-slate-600">{kat.uzasadnienie}</p>}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Przebieg */}
          {momenty.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Przebieg rozmowy</h2>
              <ol className="relative mt-5 space-y-6 border-l-2 border-slate-100 pl-6">
                {momenty.map((m, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[33px] top-1 h-4 w-4 rounded-full ring-4 ring-white ${m.ocena === "dobrze" ? "bg-emerald-500" : m.kluczowy ? "bg-rose-500" : "bg-amber-400"}`} aria-hidden="true" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs tabular-nums text-slate-400">{m.t !== null ? formatCzasu(m.t) : m.tura ? `tura ${m.tura}` : ""}</span>
                      <h3 className="font-semibold text-slate-900">{m.tytul || (m.ocena === "dobrze" ? "To zadziałało" : "Do poprawy")}</h3>
                      {m.kluczowy && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">kluczowy</span>}
                      {m.ocena === "dobrze" && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">dobrze</span>}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{m.komentarz}</p>
                    <blockquote className="mt-2 rounded-xl bg-slate-50 px-4 py-3 text-sm italic text-slate-800">„{m.cytat}”</blockquote>
                    {m.lepiej && (
                      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Powiedz tak</p>
                        <p className="mt-1 text-sm leading-relaxed text-emerald-950">„{m.lepiej}”</p>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Następne podejście */}
          {a.nastepnym.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Na następne podejście</h2>
              <ol className="mt-4 space-y-3">
                {a.nastepnym.map((x, i) => (
                  <li key={i} className="flex gap-3 text-slate-800">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm font-bold text-white">{i + 1}</span>
                    <span className="leading-relaxed">{x}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <details className="rounded-3xl border border-slate-200 bg-white p-6">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">Cała rozmowa ({transkrypt.length} wypowiedzi)</summary>
            <div className="mt-5 space-y-3">
              {transkrypt.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "agent" ? "flex-row-reverse" : ""}`}>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${m.role === "agent" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-800"}`}>
                    {m.role === "agent" ? "Ty" : "K"}
                  </span>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "agent" ? "rounded-tr-sm bg-emerald-100 text-emerald-900" : "rounded-tl-sm bg-slate-100 text-slate-800"}`}>
                    {typeof m.t === "number" && <span className="mr-2 font-mono text-[11px] text-slate-400">{formatCzasu(m.t)}</span>}
                    {bezZnacznikaRozlaczenia(m.content)}
                    {m.role === "client" && klientSieRozlaczyl(m.content) && <span className="ml-2 text-xs font-semibold text-rose-600">(rozłączył się)</span>}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Statystyki */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Kto mówił</h2>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-emerald-500" style={{ width: `${metryki.udzialAgenta}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <b className="text-slate-900">Ty {metryki.udzialAgenta}%</b>
              <span className="text-slate-500">klient {100 - metryki.udzialAgenta}%</span>
            </div>
            <p className={`mt-2 text-xs ${udzial === "dobrze" ? "text-emerald-700" : "text-amber-700"}`}>
              {udzial === "dobrze" ? "W normie. Dobry agent mówi mniej niż połowę rozmowy." : udzial === "za_duzo" ? "Mówisz za dużo. Cel: poniżej 50%, więcej pytaj." : "Prawie nic nie mówisz. Prowadź rozmowę pytaniami."}
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Statystyki rozmowy</h2>
            <dl className="mt-3 divide-y divide-slate-100 text-sm">
              <Wiersz k="Twoje słowa" v={metryki.slowaAgent} />
              <Wiersz k="Słowa klienta" v={metryki.slowaKlient} />
              <Wiersz k="Pytania (otwarte)" v={`${metryki.pytania} (${metryki.pytaniaOtwarte})`} />
              <Wiersz k="Do pierwszego pytania" v={metryki.doPierwszegoPytaniaS !== null ? `${metryki.doPierwszegoPytaniaS} s` : metryki.doPierwszegoPytaniaTura ? `tura ${metryki.doPierwszegoPytaniaTura}` : "brak pytań"} zle={metryki.doPierwszegoPytaniaTura === null || (metryki.doPierwszegoPytaniaTura ?? 0) > 2} />
              <Wiersz k="Najdłuższa wypowiedź" v={`${metryki.najdluzszaWypowiedzSlow} słów`} zle={metryki.najdluzszaWypowiedzSlow > 70} />
              <Wiersz k="Wypełniacze" v={`${metryki.wypelniacze}×`} zle={metryki.wypelniacze > 4} />
              <Wiersz k="Konkretna liczba" v={metryki.konkretnaLiczba ? "tak" : "nie"} zle={!metryki.konkretnaLiczba} />
              <Wiersz k="Konkretny termin" v={metryki.konkretnyTermin ? "tak" : "nie"} zle={!metryki.konkretnyTermin} />
            </dl>
          </section>

          {a.obiekcje.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Obiekcje klienta</h2>
              <ul className="mt-3 space-y-3">
                {a.obiekcje.map((o, i) => (
                  <li key={i} className="text-sm">
                    <p className="flex items-start gap-2 font-medium text-slate-900">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${o.rozbita ? "bg-emerald-500" : "bg-rose-500"}`} />„{o.tresc}”
                    </p>
                    <p className="ml-4.5 mt-1 pl-0.5 text-slate-500">{o.jak}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {/* Pasek akcji */}
      {showTrainAgain && (
        <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:bottom-0 md:left-64">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-10">
            <p className="text-sm">
              <b className={`tabular-nums ${k.tekst}`}>{wynik}/100</b>
              <span className="text-slate-500"> · {zaliczona ? (lekcja ? "lekcja zaliczona" : "powyżej progu") : `do progu ${prog} brakuje ${prog - wynik}`}</span>
            </p>
            <div className="flex gap-2">
              <Link href={powtorz} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-400">
                Powtórz rozmowę
              </Link>
              {nastepna ? (
                <Link href={`/app/trening/${nastepna.scenariusz}?lekcja=${nastepna.id}`} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-400">
                  Następna lekcja →
                </Link>
              ) : (
                <Link href="/app/trening" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
                  {lekcja ? "Wróć do ścieżki" : "Wybierz kolejną rozmowę"}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kafel({ etykieta, wartosc, opis }: { etykieta: string; wartosc: string; opis: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{etykieta}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{wartosc}</p>
      <p className="text-xs text-slate-500">{opis}</p>
    </div>
  );
}

function Wiersz({ k, v, zle = false }: { k: string; v: string | number; zle?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`font-semibold tabular-nums ${zle ? "text-amber-700" : "text-slate-900"}`}>{v}</dd>
    </div>
  );
}
