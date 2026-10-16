"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { ETAPY_LEJKA, type AkcjaKroku, type KrokEtapu, type Temperatura } from "@/lib/priorytety";
import type { SprawaDnia } from "@/lib/data-priorytety";
import { CLIENT_TYPE_LABELS } from "@/lib/types";
import { addDaysKey, formatDatePL, formatDateTimePL, todayPL } from "@/lib/datetime";
import { daysAgo, formatPhone, formatPln } from "@/lib/format";
import { addClientNote, markClientContacted, setNextContact, updateClientStatus } from "../klienci/actions";
import { ActivityModal } from "../dzialania/activity-modal";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { ChatIcon, MailIcon2, PhoneIcon } from "./icons";

const TEMP: Record<Temperatura, { label: string; kolor: string; chip: string }> = {
  goracy: { label: "Gorący", kolor: "#f43f5e", chip: "bg-rose-100 text-rose-700" },
  cieply: { label: "Ciepły", kolor: "#f59e0b", chip: "bg-amber-100 text-amber-700" },
  zimny: { label: "Zimny", kolor: "#0ea5e9", chip: "bg-sky-100 text-sky-700" },
};

function Pierscien({ wynik, temperatura, rozmiar = 56 }: { wynik: number; temperatura: Temperatura; rozmiar?: number }) {
  const r = 22;
  const obwod = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid flex-shrink-0 place-items-center" style={{ width: rozmiar, height: rozmiar }}>
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="26" cy="26" r={r} fill="none" strokeWidth="5" className="stroke-slate-100" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke={TEMP[temperatura].kolor}
          strokeDasharray={obwod}
          strokeDashoffset={obwod * (1 - wynik / 100)}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <span className="relative text-sm font-bold tabular-nums text-slate-900" aria-label={`Ocena ${wynik} na 100`}>
        {wynik}
      </span>
    </span>
  );
}

function whatsapp(tel: string): string {
  const d = tel.replace(/\D/g, "");
  return `https://wa.me/${d.length === 9 ? `48${d}` : d}`;
}

export function PriorytetyDnia({
  sprawy,
  aktywnych,
  agenci,
  raportDomyslnie,
}: {
  sprawy: SprawaDnia[];
  aktywnych: number;
  agenci: { id: string; name: string }[];
  raportDomyslnie: boolean;
}) {
  const [wybrana, setWybrana] = useState(sprawy[0]?.id ?? null);
  const [wiecej, setWiecej] = useState(false);
  const widoczne = wiecej ? sprawy : sprawy.slice(0, 4);
  const sprawa = sprawy.find((s) => s.id === wybrana) ?? sprawy[0];

  if (sprawy.length === 0) {
    return (
      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-900/5 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Priorytety na dziś</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Tu pojawią się klienci, do których warto dziś zadzwonić, z oceną i następnym krokiem. Zacznij od dodania pierwszego kontaktu.
        </p>
        <Link href="/app/klienci" className="mt-4 inline-flex rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">
          Dodaj klienta
        </Link>
      </section>
    );
  }

  return (
    <section className="mb-6" aria-labelledby="priorytety-tytul">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="priorytety-tytul" className="text-lg font-semibold text-slate-900">
            Priorytety na dziś
          </h2>
          <p className="text-sm text-slate-500">
            Ułożone według oceny klienta i terminów. Aktywnych klientów: {aktywnych}.
          </p>
        </div>
        <Link href="/app/klienci" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          Wszyscy klienci →
        </Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {widoczne.map((s) => {
          const on = s.id === sprawa?.id;
          const t = TEMP[s.ocena.temperatura];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setWybrana(s.id)}
              aria-pressed={on}
              className={`w-[78%] flex-shrink-0 snap-start rounded-2xl border bg-white p-4 text-left transition sm:w-auto ${
                on ? "border-emerald-400 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-400/30" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <Pierscien wynik={s.ocena.wynik} temperatura={s.ocena.temperatura} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{s.name}</p>
                  <span className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${t.chip}`}>{t.label}</span>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{s.ocena.powod}</p>
              <p className="mt-1 text-xs text-slate-400">
                {ETAPY_LEJKA.find((e) => e.value === s.status)?.label ?? s.status} · {CLIENT_TYPE_LABELS[s.type] ?? s.type}
              </p>
            </button>
          );
        })}
      </div>
      {sprawy.length > 4 && (
        <button type="button" onClick={() => setWiecej((v) => !v)} className="mt-2 text-sm font-medium text-slate-500 hover:text-slate-800">
          {wiecej ? "Pokaż mniej" : `Pokaż kolejne (${sprawy.length - 4})`}
        </button>
      )}

      {sprawa && <PanelSprawy key={sprawa.id} s={sprawa} agenci={agenci} raportDomyslnie={raportDomyslnie} />}
    </section>
  );
}

function PanelSprawy({ s, agenci, raportDomyslnie }: { s: SprawaDnia; agenci: { id: string; name: string }[]; raportDomyslnie: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [okno, setOkno] = useState<"notatka" | "termin" | "spotkanie" | null>(null);

  const zrob = (fn: () => Promise<void>, komunikat: string) =>
    start(async () => {
      await fn();
      toast(komunikat);
      router.refresh();
    });

  const etapIdx = ETAPY_LEJKA.findIndex((e) => e.value === s.status);
  const nastepny = ETAPY_LEJKA.find((e) => e.value === s.ocena.nastepnyEtap);
  const kartaHref = `/app/klienci/${s.id}`;

  function akcjaKroku(k: KrokEtapu): ReactNode {
    const btn = "rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700";
    const linki: Partial<Record<AkcjaKroku, string>> = {
      oferta: "/app/nieruchomosci",
      transakcja: "/app/prowizje",
      budzet: kartaHref,
    };
    if (k.akcja === "telefon") {
      return s.phone ? (
        <span className="flex gap-2">
          <a href={`tel:${s.phone}`} className={btn}>Zadzwoń</a>
          <button type="button" className={btn} disabled={pending} onClick={() => zrob(() => markClientContacted(s.id), "Rozmowa zapisana")}>
            Rozmowa odbyta
          </button>
        </span>
      ) : (
        <Link href={kartaHref} className={btn}>Dodaj numer</Link>
      );
    }
    if (k.akcja === "notatka" || k.akcja === "termin" || k.akcja === "spotkanie") {
      const etykieta = { notatka: "Dodaj notatkę", termin: "Wybierz termin", spotkanie: "Umów" }[k.akcja];
      return (
        <button type="button" className={btn} onClick={() => setOkno(k.akcja as "notatka" | "termin" | "spotkanie")}>
          {etykieta}
        </button>
      );
    }
    return (
      <Link href={linki[k.akcja] ?? kartaHref} className={btn}>
        Otwórz
      </Link>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      {/* Nagłówek sprawy */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Pierscien wynik={s.ocena.wynik} temperatura={s.ocena.temperatura} rozmiar={64} />
          <div className="min-w-0">
            <h3 className="truncate text-xl font-semibold text-slate-900">{s.name}</h3>
            <p className="text-sm text-slate-500">
              {[CLIENT_TYPE_LABELS[s.type] ?? s.type, s.budget_pln ? `budżet ${formatPln(s.budget_pln)}` : null, s.city].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <KontaktBtn href={s.phone ? `tel:${s.phone}` : null} ikona={<PhoneIcon className="h-4 w-4" />} label="Zadzwoń" />
          <KontaktBtn href={s.phone ? whatsapp(s.phone) : null} ikona={<ChatIcon className="h-4 w-4" />} label="WhatsApp" zewn />
          <KontaktBtn href={s.email ? `mailto:${s.email}` : null} ikona={<MailIcon2 className="h-4 w-4" />} label="E-mail" />
        </div>
      </div>

      {/* Etapy lejka */}
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <ol className="flex items-center gap-1 overflow-x-auto">
          {ETAPY_LEJKA.map((e, i) => {
            const zrobiony = i < etapIdx;
            const teraz = i === etapIdx;
            return (
              <li key={e.value} className={`flex items-center gap-1 ${i < ETAPY_LEJKA.length - 1 ? "flex-1" : ""}`}>
                <button
                  type="button"
                  disabled={pending || teraz}
                  onClick={() => zrob(() => updateClientStatus(s.id, e.value), `Etap: ${e.label}`)}
                  title={teraz ? "Obecny etap" : `Przenieś do etapu „${e.label}”`}
                  className={`flex flex-shrink-0 items-center gap-2 rounded-full px-2 py-1.5 sm:px-2.5 text-xs font-semibold whitespace-nowrap transition ${
                    teraz ? "bg-slate-900 text-white" : zrobiony ? "text-emerald-700 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                  }`}
                >
                  <span className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] ${teraz ? "bg-emerald-400 text-slate-900" : zrobiony ? "bg-emerald-100" : "bg-slate-100"}`}>
                    {zrobiony ? "✓" : i + 1}
                  </span>
                  {/* Na telefonie nazwa tylko przy obecnym etapie, inaczej pasek się nie mieści. */}
                  <span className={teraz ? "" : "hidden sm:inline"}>{e.label}</span>
                </button>
                {i < ETAPY_LEJKA.length - 1 && <span className={`h-px min-w-3 flex-1 ${zrobiony ? "bg-emerald-300" : "bg-slate-200"}`} />}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
        {/* Kroki etapu */}
        <div className="p-5 sm:p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Kroki etapu „{ETAPY_LEJKA[etapIdx]?.label ?? s.status}”
          </p>
          {s.ocena.kroki.length === 0 ? (
            <p className="text-sm text-slate-500">Na tym etapie nie ma kroków do odhaczenia.</p>
          ) : (
            <ul className="space-y-2">
              {s.ocena.kroki.map((k, i) => {
                const poprzedni = s.ocena.kroki.slice(0, i).reverse().find((x) => x.wymagany && !x.zrobiony);
                return (
                  <li
                    key={k.klucz}
                    className={`flex flex-col gap-3 rounded-2xl border p-3.5 sm:flex-row sm:items-center ${
                      k.zrobiony ? "border-emerald-100 bg-emerald-50/50" : k.zablokowany ? "border-dashed border-slate-200 opacity-60" : "border-slate-200"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className={`mt-0.5 grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs font-bold ${
                          k.zrobiony ? "bg-emerald-500 text-white" : "border-2 border-slate-300 text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${k.zrobiony ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900"}`}>
                          {k.tytul}
                          <span className={`ml-2 rounded px-1.5 py-0.5 align-middle text-[10px] font-semibold no-underline ${k.wymagany ? "bg-slate-100 text-slate-600" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}>
                            {k.wymagany ? "wymagane" : "opcjonalne"}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {k.zablokowany && poprzedni ? `Odblokuje się po: ${poprzedni.tytul.toLowerCase()}` : k.podpowiedz}
                        </p>
                      </div>
                    </div>
                    {!k.zrobiony && !k.zablokowany && <div className="flex-shrink-0 pl-9 sm:pl-0">{akcjaKroku(k)}</div>}
                  </li>
                );
              })}
            </ul>
          )}

          {s.ocena.etapGotowy && nastepny && (
            <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
              <p className="text-sm font-semibold">Etap domknięty. Co dalej?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => zrob(() => updateClientStatus(s.id, nastepny.value), `Etap: ${nastepny.label}`)}
                  className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-emerald-300"
                >
                  Przejdź do „{nastepny.label}”
                </button>
                {[3, 7, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    disabled={pending}
                    onClick={() => zrob(() => setNextContact(s.id, addDaysKey(todayPL(), d)), `Przypomnę za ${d} dni`)}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
                  >
                    Przypomnij za {d} dni
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Karta klienta w skrócie */}
        <div className="border-t border-slate-100 bg-slate-50/60 p-5 sm:p-6 lg:border-t-0 lg:border-l">
          <dl className="space-y-3 text-sm">
            <Pole label="Telefon">{s.phone ? formatPhone(s.phone) : "brak"}</Pole>
            <Pole label="Ostatni kontakt">{s.last_contact_at ? daysAgo(s.last_contact_at) : "jeszcze nie było"}</Pole>
            <Pole label="Następny kontakt">{s.next_contact_at ? formatDatePL(s.next_contact_at) : "nie zaplanowano"}</Pole>
            {s.spotkanieNajblizsze && <Pole label="Spotkanie">{formatDateTimePL(s.spotkanieNajblizsze)}</Pole>}
            {s.oferta && (
              <Pole label="Oferta">
                <Link href={`/app/nieruchomosci/${s.oferta.id}`} className="text-emerald-700 hover:underline">
                  {s.oferta.title}
                </Link>
              </Pole>
            )}
            {s.transakcjaId && (
              <Pole label="Transakcja">
                <Link href={`/app/prowizje/${s.transakcjaId}`} className="text-emerald-700 hover:underline">
                  w toku →
                </Link>
              </Pole>
            )}
          </dl>
          {s.ostatniaNotatka && (
            <figure className="mt-4 rounded-2xl bg-white p-3.5 ring-1 ring-slate-200">
              <figcaption className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Ostatnia notatka · {daysAgo(s.ostatniaNotatka.kiedy)}
              </figcaption>
              <p className="mt-1 line-clamp-4 text-sm text-slate-700">{s.ostatniaNotatka.tresc}</p>
            </figure>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setOkno("notatka")} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Notatka
            </button>
            <button type="button" onClick={() => setOkno("termin")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300">
              Przypomnij
            </button>
            <button type="button" onClick={() => setOkno("spotkanie")} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300">
              Spotkanie
            </button>
            <Link href={kartaHref} className="rounded-xl px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
              Karta klienta →
            </Link>
          </div>
        </div>
      </div>

      {okno === "notatka" && (
        <Modal title={`Notatka: ${s.name}`} onClose={() => setOkno(null)}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            action={(fd) => {
              zrob(() => addClientNote(s.id, fd), "Notatka zapisana");
              setOkno(null);
            }}
          >
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <textarea
                name="content"
                required
                autoFocus
                rows={6}
                placeholder="Co ustaliliście? Potrzeby, terminy, obiekcje."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
              <p className="mt-2 text-xs text-slate-400">Zapis notatki ustawia też datę ostatniego kontaktu.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={() => setOkno(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Anuluj
              </button>
              <button type="submit" className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-400">
                Zapisz
              </button>
            </div>
          </form>
        </Modal>
      )}

      {okno === "termin" && <OknoTerminu s={s} onClose={() => setOkno(null)} zapisz={(d, kom) => zrob(() => setNextContact(s.id, d), kom)} />}

      <ActivityModal
        agents={agenci}
        clients={[{ id: s.id, name: s.name, phone: s.phone }]}
        properties={s.oferta ? [{ id: s.oferta.id, name: s.oferta.title }] : []}
        presetClientId={s.id}
        presetKind="spotkanie"
        trigger="none"
        reportDefault={raportDomyslnie}
        open={okno === "spotkanie"}
        onOpenChange={(v) => {
          setOkno(v ? "spotkanie" : null);
          if (!v) router.refresh();
        }}
      />
    </div>
  );
}

function OknoTerminu({ s, onClose, zapisz }: { s: SprawaDnia; onClose: () => void; zapisz: (data: string | null, komunikat: string) => void }) {
  const [data, setData] = useState(s.next_contact_at?.slice(0, 10) ?? addDaysKey(todayPL(), 3));
  const wybierz = (d: string | null, kom: string) => {
    zapisz(d, kom);
    onClose();
  };
  return (
    <Modal title={`Przypomnienie: ${s.name}`} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-3 gap-2">
          {[3, 7, 14].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => wybierz(addDaysKey(todayPL(), d), `Przypomnę za ${d} dni`)}
              className="rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
            >
              za {d} dni
            </button>
          ))}
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Albo konkretny dzień
          <input
            type="date"
            value={data}
            min={todayPL()}
            onChange={(e) => setData(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
        </label>
        <div className="flex flex-wrap justify-between gap-2">
          {s.next_contact_at ? (
            <button type="button" onClick={() => wybierz(null, "Przypomnienie usunięte")} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
              Usuń przypomnienie
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={!data}
            onClick={() => wybierz(data, `Przypomnienie na ${formatDatePL(data)}`)}
            className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Zapisz termin
          </button>
        </div>
      </div>
    </Modal>
  );
}

function KontaktBtn({ href, ikona, label, zewn }: { href: string | null; ikona: ReactNode; label: string; zewn?: boolean }) {
  const cls = "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2.5 py-2 sm:gap-2 sm:px-3.5 text-sm font-semibold transition";
  if (!href) {
    return (
      <span className={`${cls} cursor-not-allowed border-slate-100 text-slate-300`} title={`${label}: brak danych`}>
        <span className="flex-shrink-0">{ikona}</span>
        {label}
      </span>
    );
  }
  return (
    <a href={href} target={zewn ? "_blank" : undefined} rel={zewn ? "noopener noreferrer" : undefined} className={`${cls} border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-700`}>
      <span className="flex-shrink-0">{ikona}</span>
      {label}
    </a>
  );
}

function Pole({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}
