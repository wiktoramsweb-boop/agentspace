import Link from "next/link";
import { requireModul } from "@/lib/auth";
import { maModul } from "@/lib/role";
import { postepAkademii } from "@/lib/data-akademia";
import { nazwaAkademii, stanAkademii } from "@/lib/techniki/akademia";
import { PowrotDoAkademii } from "./akademia/powrot";
import { SciezkaAkademii } from "./akademia/sciezka-akademii";
import { KATEGORIE, TECHNIKI, type Kategoria } from "@/lib/techniki/techniki";
import { SKRYPTY, STRUKTURA } from "@/lib/techniki/skrypty";
import { PageHeader } from "../components/page-header";
import { KOLOR, POZIOM, Sila, Zakladki } from "./wspolne";
import { OBIEKCJE } from "@/lib/techniki/obiekcje";
import { BankObiekcji } from "./bank-obiekcji";

export const metadata = { title: "Biblioteka technik" };

type Props = { searchParams: Promise<{ widok?: string; k?: string; q?: string; akademia?: string }> };

const bezOgonkow = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

export default async function TechnikiPage({ searchParams }: Props) {
  const user = await requireModul("coach");
  const sp = await searchParams;
  const widok = sp.widok === "skrypty" || sp.widok === "struktura" || sp.widok === "obiekcje" || sp.widok === "akademia" ? sp.widok : "techniki";
  const kat = sp.k && sp.k in KATEGORIE ? (sp.k as Kategoria) : null;
  const q = (sp.q ?? "").trim().slice(0, 60);

  const lista = TECHNIKI.filter((t) => (!kat || t.kategoria === kat) && (!q || bezOgonkow(`${t.nazwa} ${t.skrot} ${t.zrodlo}`).includes(bezOgonkow(q))));

  return (
    <>
      <PageHeader
        title="Biblioteka technik"
        subtitle="Techniki rozmowy, gotowe skrypty i struktura dobrej rozmowy. Każdą technikę od razu przećwiczysz z klientem AI."
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { liczba: TECHNIKI.length, opis: "technik z przykładami z polskiego rynku" },
          { liczba: SKRYPTY.length, opis: "skryptów rozmów krok po kroku" },
          { liczba: OBIEKCJE.length, opis: "obiekcji z trzema wersjami odpowiedzi" },
        ].map((x) => (
          <div key={x.opis} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <b className="block text-3xl font-bold tabular-nums text-slate-900">{x.liczba}</b>
            <span className="text-sm text-slate-500">{x.opis}</span>
          </div>
        ))}
      </section>

      <Zakladki aktywna={widok} nazwaAkademii={nazwaAkademii(user.agency_id).pelna} />

      {widok === "techniki" && (
        <>
          <form className="mb-4 flex gap-2" action="/app/techniki">
            {kat && <input type="hidden" name="k" value={kat} />}
            <input
              name="q"
              defaultValue={q}
              placeholder="Szukaj techniki, np. kotwica, Voss, cisza"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            />
            <button className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">Szukaj</button>
          </form>

          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href={q ? `/app/techniki?q=${encodeURIComponent(q)}` : "/app/techniki"}
              scroll={false}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${!kat ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
            >
              Wszystkie
            </Link>
            {(Object.keys(KATEGORIE) as Kategoria[]).map((k) => (
              <Link
                key={k}
                href={`/app/techniki?k=${k}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                scroll={false}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  kat === k ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${KOLOR[k].kropka}`} />
                {KATEGORIE[k].nazwa}
              </Link>
            ))}
          </div>

          {kat && <p className="mb-4 text-sm text-slate-500">{KATEGORIE[kat].opis}</p>}

          {lista.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nic nie pasuje do „{q}”. Spróbuj innego słowa.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((t) => (
                <Link
                  key={t.slug}
                  href={`/app/techniki/${t.slug}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${KOLOR[t.kategoria].tlo} ${KOLOR[t.kategoria].tekst}`}>
                      {KATEGORIE[t.kategoria].nazwa}
                    </span>
                    <Sila wartosc={t.sila} />
                  </div>
                  <h2 className="font-semibold text-slate-900 group-hover:text-emerald-700">{t.nazwa}</h2>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{t.skrot}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {t.zrodlo} · {POZIOM[t.poziom]}
                    </span>
                    {t.etyka === "ostroznie" && <span className="font-medium text-amber-600">używaj uczciwie</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {widok === "akademia" && <Akademia user={user} />}
      {(widok === "obiekcje" || widok === "struktura") && <PowrotDoAkademii user={user} lekcjaId={sp.akademia} />}

      {widok === "obiekcje" && <BankObiekcji lista={OBIEKCJE} nazwyTechnik={Object.fromEntries(TECHNIKI.map((t) => [t.slug, t.nazwa]))} />}

      {widok === "skrypty" && (
        <div className="grid gap-3 md:grid-cols-2">
          {SKRYPTY.map((s) => (
            <Link
              key={s.slug}
              href={`/app/techniki/skrypty/${s.slug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                <span className={`rounded-full px-2.5 py-0.5 ${s.rodzaj === "telefon" ? "bg-cyan-50 text-cyan-700" : "bg-violet-50 text-violet-700"}`}>
                  {s.rodzaj === "telefon" ? "Telefon" : "Spotkanie"}
                </span>
                <span className="text-slate-400">{s.czas}</span>
              </div>
              <h2 className="font-semibold text-slate-900 group-hover:text-emerald-700">{s.nazwa}</h2>
              <p className="mt-1 text-sm text-slate-500">
                <b className="font-medium text-slate-700">Cel:</b> {s.cel}
              </p>
              <div className="mt-4 flex gap-1">
                {s.etapy.map((e) => (
                  <span key={e.nazwa} className="h-1.5 flex-1 rounded-full bg-emerald-200 transition group-hover:bg-emerald-400" title={e.nazwa} />
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {s.etapy.length} etapów · {s.obiekcje.length} obiekcji z odpowiedziami
              </p>
            </Link>
          ))}
        </div>
      )}

      {widok === "struktura" && (
        <section>
          <div className="mb-6 rounded-3xl bg-slate-900 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Uniwersalna struktura</p>
            <h2 className="mt-1 text-xl font-semibold">Każda dobra rozmowa ma sześć etapów</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Telefon do właściciela, prezentacja, negocjacja: kolejność jest ta sama. Szerokość paska to orientacyjny udział etapu w czasie rozmowy.
              Najwięcej czasu zajmuje diagnoza, czyli słuchanie.
            </p>
            <div className="mt-5 flex h-3 gap-0.5 overflow-hidden rounded-full">
              {STRUKTURA.map((e, i) => (
                <span key={e.nazwa} style={{ width: `${e.procent}%`, opacity: 0.45 + i * 0.11 }} className="bg-emerald-400" title={e.nazwa} />
              ))}
            </div>
          </div>
          <ol className="grid gap-3 md:grid-cols-2">
            {STRUKTURA.map((e, i) => (
              <li key={e.nazwa} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900">{e.nazwa}</h3>
                    <p className="text-xs text-slate-400">ok. {e.procent}% rozmowy</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{e.cel}</p>
                <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  <b>Pułapka:</b> {e.pulapka}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-slate-500">
            Gotowe rozmowy rozpisane według tej struktury znajdziesz w zakładce{" "}
            <Link href="/app/techniki?widok=skrypty" className="font-semibold text-emerald-700 hover:underline">
              Skrypty rozmów
            </Link>
            .
          </p>
        </section>
      )}
    </>
  );
}

async function Akademia({ user }: { user: Awaited<ReturnType<typeof requireModul>> }) {
  const { ready, wpisy } = await postepAkademii(user.agency_id, user.id);
  const widziZespol = maModul({ id: user.id, role: user.role, permissions: user.permissions }, "szkolenie");
  if (!ready) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Akademia wymaga migracji <code>lib/SETUP-v56-akademia.sql</code> w Supabase.
      </p>
    );
  }
  const stan = stanAkademii(wpisy);
  const nazwa = nazwaAkademii(user.agency_id);
  const procent = Math.round((stan.lekcjiZrobionych / stan.lekcjiWszystkich) * 100);
  return (
    <>
      <section className="mb-8 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-[28px] bg-slate-900 p-6 text-white">
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">{nazwa.pelna}</p>
            <p className="mt-2 max-w-md text-lg font-semibold leading-snug">
              {stan.ukonczona
                ? `${nazwa.krotka} ukończona. Teraz trenuj z klientem AI i wracaj do technik, kiedy chcesz.`
                : "Sześć modułów od pierwszej rozmowy do negocjacji. Lekcja, krótki sprawdzian, następny moduł."}
            </p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${procent}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-300">
              {stan.lekcjiZrobionych}/{stan.lekcjiWszystkich} lekcji · {stan.zaliczonych}/{stan.sprawdzianow} sprawdzianów
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <p className="text-3xl font-bold tabular-nums text-slate-900">{stan.srednia !== null ? `${stan.srednia}%` : "–"}</p>
            <p className="text-sm text-slate-500">średni wynik sprawdzianów</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <p className="text-3xl font-bold tabular-nums text-slate-900">{stan.moduly.filter((m) => m.ukonczony).length}/6</p>
            <p className="text-sm text-slate-500">ukończonych modułów</p>
          </div>
          {widziZespol && (
            <Link href="/app/techniki/akademia/zespol" className="col-span-2 flex items-center justify-between rounded-[28px] border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-md">
              <span>
                <span className="block font-semibold text-slate-900">Postępy zespołu</span>
                <span className="text-sm text-slate-500">Kto gdzie jest, wyniki sprawdzianów, podejścia</span>
              </span>
              <span className="text-slate-400">→</span>
            </Link>
          )}
        </div>
      </section>
      <SciezkaAkademii stan={stan} nazwa={nazwa.krotka} />
    </>
  );
}
