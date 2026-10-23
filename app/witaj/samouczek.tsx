"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "../components/marka";

type Props = { imie: string | null; ceo: boolean; demo: boolean; biuro: string };

const KROKOW = 9;

/** Zielona plakietka „kliknij” pod elementem, który prowadzi dalej. */
function Kliknij({ widac = true }: { widac?: boolean }) {
  if (!widac) return null;
  return (
    <span className="witaj-kliknij pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow-md">
      kliknij
    </span>
  );
}

function Akcja({ children, onClick, widac = true, wariant = "pelny" }: { children: ReactNode; onClick: () => void; widac?: boolean; wariant?: "pelny" | "obrys" }) {
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        className={
          wariant === "pelny"
            ? `rounded-xl bg-emerald-700 px-6 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-600 ${widac ? "witaj-swiec" : ""}`
            : "rounded-xl border-2 border-emerald-700 px-6 py-3 text-[15px] font-bold text-emerald-800 transition hover:bg-emerald-50"
        }
      >
        {children}
      </button>
      <Kliknij widac={widac} />
    </span>
  );
}

function Naglowek({ nad, tytul, pod }: { nad: string; tytul: ReactNode; pod: ReactNode }) {
  return (
    <div className="witaj-wejscie mx-auto max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">{nad}</p>
      <h1 className="mt-3 text-[clamp(28px,4.4vw,46px)] font-extrabold leading-[1.08] tracking-tight text-slate-900">{tytul}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-relaxed text-slate-600">{pod}</p>
    </div>
  );
}

function Scena({ children }: { children: ReactNode }) {
  return <div className="witaj-wejscie mt-10 rounded-[28px] bg-emerald-50/80 p-4 ring-1 ring-emerald-900/5 sm:p-8 [animation-delay:120ms]">{children}</div>;
}

function Karta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:p-6 ${className}`}>{children}</div>;
}

function Wynik({ children }: { children: ReactNode }) {
  return <p className="witaj-wejscie mt-6 text-center text-[15px] font-semibold text-emerald-800">{children}</p>;
}

/* ───────────── kroki ───────────── */

function Start({ imie, dalej }: { imie: string | null; dalej: () => void }) {
  return (
    <>
      <Naglowek
        nad="Witaj w AgentSpace"
        tytul={<>Cześć{imie ? `, ${imie}` : ""}. Pokażę Ci system na jednej sprawie.</>}
        pod="Od pierwszego zapytania do spotkania z właścicielką, w dwie minuty. Klikasz tylko tam, gdzie świeci się „kliknij”."
      />
      <Scena>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { t: "Leady i lejek", o: "Zapytanie trafia do panelu, a Ty prowadzisz je do umowy." },
            { t: "AI Coach", o: "Ćwiczysz rozmowę z AI, zanim zadzwonisz naprawdę." },
            { t: "Ofertówka i cele", o: "Oferta w kolorach biura i plan dnia, który się odhacza." },
          ].map((k, i) => (
            <Karta key={k.t} className="witaj-wejscie" >
              <p className="text-xs font-bold text-emerald-700">0{i + 1}</p>
              <p className="mt-1 font-bold text-slate-900">{k.t}</p>
              <p className="mt-1 text-sm text-slate-600">{k.o}</p>
            </Karta>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 pb-6">
          <Akcja onClick={dalej}>Zaczynamy →</Akcja>
        </div>
      </Scena>
    </>
  );
}

function Lead({ zrobione, zrob }: { zrobione: boolean; zrob: () => void }) {
  return (
    <>
      <Naglowek
        nad="Leady"
        tytul="Wpadło nowe zapytanie."
        pod="Formularz ze strony Twojego biura i zgłoszenia z innych źródeł lądują w jednym miejscu. Nikt nie przepisuje maili do zeszytu."
      />
      <Scena>
        <Karta className="mx-auto max-w-xl">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-100 font-bold text-emerald-800">AW</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold text-slate-900">Anna Wiśniewska</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${zrobione ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {zrobione ? "Przypisany: Ty" : "Nowy"}
                </span>
              </div>
              <p className="mt-1 text-slate-700">Chce sprzedać mieszkanie: Podgórze, 67 m², 3 pokoje</p>
              <p className="mt-1 text-sm text-slate-500">Ze strony www biura · 2 min temu · +48 600 *** 214</p>
            </div>
          </div>
          <div className="mt-5 flex justify-end pb-6">
            {zrobione ? (
              <span className="witaj-wejscie rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800">✓ Lead jest Twój</span>
            ) : (
              <Akcja onClick={zrob}>Przypisz do mnie</Akcja>
            )}
          </div>
        </Karta>
        {zrobione && <Wynik>Pani Anna trafiła do Twoich klientów. Teraz zobaczysz ją w lejku.</Wynik>}
      </Scena>
    </>
  );
}

const ETAPY = ["Nowy", "W kontakcie", "Oględziny", "Negocjacje", "Zamknięty"];

function Lejek({ zrobione, zrob }: { zrobione: boolean; zrob: () => void }) {
  const gdzie = zrobione ? 1 : 0;
  return (
    <>
      <Naglowek
        nad="Twój lejek"
        tytul={zrobione ? "Przeszliśmy do następnego kroku." : "Prowadzisz ją w lejku."}
        pod="Każdy klient ma swoje miejsce i następny krok. Właściciel biura widzi ten sam lejek dla całego zespołu."
      />
      <Scena>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <div className="grid min-w-[720px] grid-cols-5 gap-3">
            {ETAPY.map((e, i) => (
              <div key={e} className={`min-h-[190px] rounded-2xl bg-white p-3 ring-1 transition ${i === gdzie ? "ring-2 ring-emerald-600" : "ring-slate-900/5"}`}>
                <p className="px-1 text-sm font-bold text-slate-800">{e}</p>
                {i === gdzie && (
                  <div key={gdzie} className="witaj-wjazd mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50/60 p-3">
                    <p className="font-bold text-slate-900">Anna Wiśniewska</p>
                    <p className="text-sm text-slate-600">Podgórze · 67 m²</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-800">{zrobione ? "dziś · rozmowa odbyta" : "nowe zapytanie"}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-center pb-6">
          {zrobione ? (
            <Wynik>Sprawa przeszła z „Nowy” do „W kontakcie”. Jedno kliknięcie, bez arkusza.</Wynik>
          ) : (
            <Akcja onClick={zrob}>Zadzwoniłem, przesuń dalej</Akcja>
          )}
        </div>
      </Scena>
    </>
  );
}

function Pierscien({ wynik }: { wynik: number }) {
  const r = 52;
  const obwod = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="#047857"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={obwod}
        strokeDashoffset={obwod * (1 - wynik / 100)}
        transform="rotate(-90 60 60)"
        className="witaj-pierscien"
        style={{ ["--obwod" as string]: `${obwod}` }}
      />
      <text x="60" y="58" textAnchor="middle" className="fill-slate-900 text-[30px] font-extrabold">{wynik}</text>
      <text x="60" y="78" textAnchor="middle" className="fill-slate-500 text-[12px]">na 100</text>
    </svg>
  );
}

function Coach({ imie, zrobione, zrob }: { imie: string | null; zrobione: boolean; zrob: () => void }) {
  const ja = imie ?? "Marek";
  const linie: { kto: "k" | "ty"; t: string }[] = [
    { kto: "k", t: "Słucham?" },
    { kto: "ty", t: `Dzień dobry, ${ja} z biura nieruchomości. Dzwonię w sprawie mieszkania na Podgórzu.` },
    { kto: "k", t: "Ja sprzedaję sama. Biura nie są mi potrzebne." },
    { kto: "ty", t: "Rozumiem. Mogę zapytać, ile osób już je oglądało?" },
    { kto: "k", t: "No... dwie. I żadna nie wróciła." },
  ];
  const [ile, setIle] = useState(1);
  useEffect(() => {
    if (ile >= linie.length) return;
    const t = setTimeout(() => setIle((n) => n + 1), 1300);
    return () => clearTimeout(t);
  }, [ile, linie.length]);
  const gotowe = ile >= linie.length;

  return (
    <>
      <Naglowek
        nad="AI Coach"
        tytul="Zanim zadzwonisz, przećwicz rozmowę."
        pod="AI gra właścicielkę: odpowiada głosem, ma swoje obiekcje i potrafi się rozłączyć. Po rozmowie dostajesz ocenę i konkretną poradę."
      />
      <Scena>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[340px] rounded-[38px] bg-slate-900 p-3 shadow-2xl">
            <div className="rounded-[30px] bg-gradient-to-b from-slate-700 to-slate-950 px-5 pb-6 pt-8 text-white">
              <p className="text-center text-[11px] uppercase tracking-[0.25em] text-white/60">{zrobione ? "Rozmowa zakończona" : "Połączenie trwa"}</p>
              <div className="mx-auto mt-4 grid h-16 w-16 place-items-center rounded-full bg-white/10 text-2xl font-bold">A</div>
              <p className="mt-2 text-center text-lg font-bold">Pani Anna</p>
              <div className="mt-5 flex h-[230px] flex-col justify-end gap-2 overflow-hidden text-sm">
                {linie.slice(0, ile).map((l, i) => (
                  <p key={i} className={`witaj-wejscie rounded-2xl px-3 py-2 ${l.kto === "k" ? "mr-8 bg-white/10" : "ml-8 bg-emerald-600/90"}`}>
                    {l.t}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {zrobione ? (
            <Karta className="witaj-wejscie">
              <div className="flex flex-wrap items-center gap-5">
                <Pierscien wynik={74} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ocena rozmowy</p>
                  <p className="mt-1 text-xl font-extrabold text-slate-900">Dobre pytanie, słabe domknięcie</p>
                  <p className="mt-1 text-slate-600">Obiekcję „sprzedaję sama” obszedłeś pytaniem, a nie kłótnią. Zabrakło propozycji spotkania.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Otwarcie", 17, 20],
                  ["Kwalifikacja", 19, 25],
                  ["Obiekcje", 24, 30],
                  ["Zamknięcie", 14, 25],
                ].map(([n, p, m]) => (
                  <div key={n as string}>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">{n}</span>
                      <span className="tabular-nums text-slate-500">{p}/{m}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="witaj-pasek h-full rounded-full bg-emerald-600" style={{ width: `${((p as number) / (m as number)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                <b>Następnym razem:</b> zaproponuj konkretny termin, np. „Mogę wpaść w czwartek o 17 i pokazać, za ile sprzedają się podobne mieszkania”.
              </p>
            </Karta>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
              <p className="max-w-sm text-slate-600">{gotowe ? "Rozmowa doszła do ważnego momentu. Zobacz, jak AI ją oceniło." : "Słuchaj, jak idzie rozmowa..."}</p>
              {gotowe && (
                <div className="pb-6">
                  <Akcja onClick={zrob}>Zakończ i zobacz ocenę</Akcja>
                </div>
              )}
            </div>
          )}
        </div>
      </Scena>
    </>
  );
}

const DYKTANDO = "Rozmawiałem z panią Anną z Podgórza. Zgodziła się na spotkanie w czwartek o siedemnastej. Chce poznać realną cenę, przygotuję analizę.";

function SzybkiWpis({ zrobione, zrob }: { zrobione: boolean; zrob: () => void }) {
  const [znaki, setZnaki] = useState(0);
  useEffect(() => {
    if (!zrobione || znaki >= DYKTANDO.length) return;
    const t = setTimeout(() => setZnaki((n) => Math.min(DYKTANDO.length, n + 3)), 22);
    return () => clearTimeout(t);
  }, [zrobione, znaki]);
  const gotowe = zrobione && znaki >= DYKTANDO.length;

  return (
    <>
      <Naglowek
        nad="Szybki wpis"
        tytul="Po rozmowie mówisz, AI wpisuje."
        pod="Z samochodu, bez pisania. Notatka, zadanie i termin same trafiają do karty klienta i do kalendarza."
      />
      <Scena>
        <div className="mx-auto max-w-2xl">
          <Karta>
            <div className="flex items-center gap-4">
              <span className="relative inline-flex">
                <button
                  type="button"
                  onClick={zrob}
                  disabled={zrobione}
                  aria-label="Nagraj notatkę"
                  className={`grid h-16 w-16 shrink-0 place-items-center rounded-full text-white shadow-lg transition ${zrobione ? "bg-rose-500" : "witaj-swiec bg-emerald-700 hover:bg-emerald-600"}`}
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                  </svg>
                </button>
                <Kliknij widac={!zrobione} />
              </span>
              <p className="min-h-[72px] flex-1 text-[15px] leading-relaxed text-slate-700">
                {zrobione ? (
                  <>
                    {DYKTANDO.slice(0, znaki)}
                    {!gotowe && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-slate-500 align-middle" />}
                  </>
                ) : (
                  <span className="text-slate-400">Naciśnij mikrofon i powiedz, co ustaliłeś.</span>
                )}
              </p>
            </div>
          </Karta>
          {gotowe && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Notatka", "w karcie Pani Anny"],
                ["Zadanie", "Przygotuj analizę cen"],
                ["Spotkanie", "czwartek, 17:00"],
              ].map(([a, b], i) => (
                <div key={a} className="witaj-wejscie rounded-2xl bg-white p-4 ring-1 ring-emerald-600/30" style={{ animationDelay: `${i * 140}ms` }}>
                  <p className="text-sm font-bold text-emerald-800">✓ {a}</p>
                  <p className="mt-0.5 text-sm text-slate-700">{b}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {gotowe && <Wynik>Trzy rzeczy zapisane jednym zdaniem, a Ty nie dotknąłeś klawiatury.</Wynik>}
      </Scena>
    </>
  );
}

const KOLORY = [
  { n: "Zieleń", k: "#047857" },
  { n: "Granat", k: "#1e3a8a" },
  { n: "Bordo", k: "#881337" },
  { n: "Grafit", k: "#1f2937" },
  { n: "Miedź", k: "#9a5b2b" },
];

function Ofertowka({ biuro, zrobione, zrob }: { biuro: string; zrobione: boolean; zrob: () => void }) {
  const [kolor, setKolor] = useState(KOLORY[0].k);
  return (
    <>
      <Naglowek
        nad="Ofertówka"
        tytul="Oferta w kolorach Twojego biura."
        pod="Zdjęcia, opis i parametry z karty nieruchomości składają się w gotowy PDF. Kolor i logo ustawiasz raz, dla całego zespołu."
      />
      <Scena>
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <p className="font-bold text-slate-900">Wybierz kolor biura</p>
            <div className="mt-4 flex flex-wrap gap-3 pb-8">
              {KOLORY.map((c, i) => (
                <span key={c.k} className="relative inline-flex">
                  <button
                    type="button"
                    onClick={() => {
                      setKolor(c.k);
                      zrob();
                    }}
                    aria-label={c.n}
                    className={`h-12 w-12 rounded-full ring-offset-2 transition hover:scale-110 ${kolor === c.k && zrobione ? "ring-4 ring-slate-900/20" : ""} ${!zrobione && i === 1 ? "witaj-swiec" : ""}`}
                    style={{ background: c.k }}
                  />
                  <Kliknij widac={!zrobione && i === 1} />
                </span>
              ))}
            </div>
            {zrobione && <p className="witaj-wejscie text-[15px] font-semibold text-emerald-800">Gotowe. Każda nowa oferta w biurze wyjdzie w tym kolorze, z Waszym logo i danymi agenta.</p>}
          </div>

          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between px-5 py-3 text-white transition-colors duration-500" style={{ background: kolor }}>
              <span className="truncate text-sm font-bold">{biuro}</span>
              <span className="text-[11px] opacity-80">Oferta SP/2026/014</span>
            </div>
            <div className="h-36 bg-gradient-to-br from-stone-200 via-stone-100 to-amber-100" />
            <div className="p-5">
              <p className="text-lg font-extrabold text-slate-900">Mieszkanie 3 pokoje, Podgórze</p>
              <p className="mt-1 text-2xl font-extrabold transition-colors duration-500" style={{ color: kolor }}>978 000 zł</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  ["67 m²", "metraż"],
                  ["3", "pokoje"],
                  ["4/6", "piętro"],
                ].map(([a, b]) => (
                  <div key={b} className="rounded-lg bg-slate-50 py-2">
                    <p className="font-bold text-slate-900">{a}</p>
                    <p className="text-slate-500">{b}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
                <span className="h-8 w-8 rounded-full transition-colors duration-500" style={{ background: kolor }} />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Twój agent</p>
                  <p className="text-slate-500">telefon i e-mail z profilu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Scena>
    </>
  );
}

function Cele({ zrobione, zrob }: { zrobione: boolean; zrob: () => void }) {
  const telefony = zrobione ? 8 : 7;
  return (
    <>
      <Naglowek
        nad="Cele"
        tytul="Każdy telefon przybliża Cię do celu."
        pod="Roczny cel prowizji rozpisuje się na tygodnie i dni. Odhaczasz, co zrobiłeś, i od razu widzisz, czy jesteś na kursie."
      />
      <Scena>
        <Karta className="mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900">Plan na dziś</p>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Passa: {zrobione ? 4 : 3} dni</span>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ["Telefony do właścicieli", telefony, 10],
              ["Spotkania", 1, 2],
              ["Nowe umowy", 0, 1],
            ].map(([n, a, b]) => (
              <div key={n as string}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-700">{n}</span>
                  <span className="tabular-nums font-bold text-slate-900">{a}/{b}</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-600 transition-all duration-700" style={{ width: `${((a as number) / (b as number)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="relative mt-6 flex justify-center pb-6">
            {zrobione ? (
              <span className="witaj-xp text-lg font-extrabold text-emerald-700">+XP · 8 z 10 telefonów</span>
            ) : (
              <Akcja onClick={zrob}>+1 telefon</Akcja>
            )}
          </div>
        </Karta>
        {zrobione && <Wynik>Telefon do Pani Anny się liczy. Za tydzień zobaczysz, czy rośnie z tego prowizja.</Wynik>}
      </Scena>
    </>
  );
}

function Zespol({ ceo, zrobione, zrob }: { ceo: boolean; zrobione: boolean; zrob: () => void }) {
  const ludzie = [
    ["Kasia", 42, 6, 81],
    ["Tomek", 35, 4, 64],
    ["Ty", 31, 3, 74],
    ["Ola", 18, 1, 47],
  ] as const;
  return (
    <>
      <Naglowek
        nad="Panel właściciela"
        tytul={ceo ? "Widzisz, co naprawdę dzieje się w biurze." : "Szef widzi zespół, Ty swój postęp."}
        pod="Telefony, spotkania i wyniki treningów każdego agenta w jednym widoku. Bez pytania na zebraniu, kto ile zrobił."
      />
      <Scena>
        <Karta className="mx-auto max-w-2xl overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="pb-2 font-semibold">Agent</th>
                <th className="pb-2 text-right font-semibold">Telefony</th>
                <th className="pb-2 text-right font-semibold">Spotkania</th>
                <th className="pb-2 text-right font-semibold">AI Coach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ludzie.map(([n, t, s, c]) => (
                <tr key={n} className={zrobione && n === "Ola" ? "bg-rose-50" : ""}>
                  <td className="py-2.5 font-semibold text-slate-900">{n}</td>
                  <td className="py-2.5 text-right tabular-nums">{t}</td>
                  <td className="py-2.5 text-right tabular-nums">{s}</td>
                  <td className={`py-2.5 text-right font-bold tabular-nums ${c < 60 ? "text-rose-600" : "text-emerald-700"}`}>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5 flex justify-center pb-6">
            {zrobione ? (
              <div className="witaj-wejscie w-full rounded-xl bg-rose-50 p-4 text-sm text-rose-900">
                <b>Najsłabszy obszar biura: obiekcje o prowizję.</b> Ola ma średnio 47 punktów. Możesz jej zadać lekcję „Nie zapłacę prowizji” w AI Coach i sprawdzić wynik za tydzień.
              </div>
            ) : (
              <Akcja onClick={zrob}>Pokaż słabe punkty zespołu</Akcja>
            )}
          </div>
        </Karta>
      </Scena>
    </>
  );
}

function Koniec({ ceo, demo, biuro }: { ceo: boolean; demo: boolean; biuro: string }) {
  const kroki = demo
    ? [
        ["Przećwicz rozmowę z AI", "/app/trening"],
        ["Zobacz klientów i lejek", "/app/klienci"],
        ["Zrób ofertówkę", "/app/ofertowka"],
        ["Sprawdź cele", "/app/cele"],
      ]
    : [
        ...(ceo ? [["Uzupełnij dane firmy i logo", "/app/ustawienia"], ["Zaproś agentów", "/app/zespol"]] : []),
        ["Przećwicz pierwszą rozmowę", "/app/trening"],
        ["Dodaj pierwszego klienta", "/app/klienci"],
        ["Ustaw swój cel na rok", "/app/cele"],
      ];
  const umiesz = ["Leady w jednym miejscu", "Lejek klientów", "Trening z AI Coach", "Szybki wpis głosem", "Ofertówka w kolorach biura", "Cele i passa", "Wyniki zespołu"];
  return (
    <>
      <Naglowek
        nad="Gotowe"
        tytul={demo ? "Teraz przeklikaj prawdziwą aplikację." : <>{biuro} czeka na start.</>}
        pod={demo ? "Wszystko, co widziałeś, działa w demo na przykładowym biurze. Zapisywanie jest wyłączone, trening z AI działa naprawdę." : "Wszystko, co widziałeś, masz już w panelu. Zacznij od kilku kroków niżej, resztę odkryjesz w trakcie pracy."}
      />
      <Scena>
        <div className="grid gap-4 md:grid-cols-2">
          <Karta>
            <p className="font-bold text-slate-900">Co już wiesz</p>
            <ul className="mt-3 space-y-2">
              {umiesz.map((u, i) => (
                <li key={u} className="witaj-wejscie flex items-center gap-2.5 text-[15px] text-slate-700" style={{ animationDelay: `${i * 70}ms` }}>
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">✓</span>
                  {u}
                </li>
              ))}
            </ul>
          </Karta>
          <Karta>
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900">{demo ? "Od czego zacząć" : "Pierwsze kroki"}</p>
              <span className="text-sm font-bold text-emerald-700">0 z {kroki.length}</span>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {kroki.map(([t, h]) => (
                <li key={h}>
                  <Link href={h} className="group flex items-center gap-3 py-3 text-[15px] font-semibold text-slate-800">
                    <span className="h-5 w-5 rounded-full border-2 border-slate-300 transition group-hover:border-emerald-600" />
                    <span className="flex-1">{t}</span>
                    <span className="text-emerald-700 transition group-hover:translate-x-1">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Karta>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {demo ? (
            <>
              <Link href="/app" className="rounded-xl bg-emerald-700 px-6 py-3.5 font-bold text-white hover:bg-emerald-600">Wejdź do demo →</Link>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- zwykły link: Link pobierałby adres z wyprzedzeniem, a to wylogowuje */}
              <a href="/demo-wyjdz?dalej=signup" className="rounded-xl border-2 border-emerald-700 px-6 py-3 font-bold text-emerald-800 hover:bg-emerald-50">Załóż konto za darmo</a>
            </>
          ) : (
            <>
              <Link href={ceo ? "/app/start" : "/app"} className="rounded-xl bg-emerald-700 px-6 py-3.5 font-bold text-white hover:bg-emerald-600">Przejdź do panelu →</Link>
              <Link href="/app/trening" className="rounded-xl border-2 border-emerald-700 px-6 py-3 font-bold text-emerald-800 hover:bg-emerald-50">Najpierw trening z AI</Link>
            </>
          )}
        </div>
      </Scena>
    </>
  );
}

/* ───────────── rama ───────────── */

export function Samouczek({ imie, ceo, demo, biuro }: Props) {
  const [krok, setKrok] = useState(0);
  const [zrobione, setZrobione] = useState<boolean[]>(() => Array(KROKOW).fill(false));

  const dalej = () => {
    setKrok((k) => Math.min(KROKOW - 1, k + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const wstecz = () => setKrok((k) => Math.max(0, k - 1));
  const zrob = () => setZrobione((z) => z.map((v, i) => (i === krok ? true : v)));
  const jest = zrobione[krok];

  const kroki: ReactNode[] = [
    <Start key="s" imie={imie} dalej={dalej} />,
    <Lead key="l" zrobione={jest} zrob={zrob} />,
    <Lejek key="j" zrobione={jest} zrob={zrob} />,
    <Coach key="c" imie={imie} zrobione={jest} zrob={zrob} />,
    <SzybkiWpis key="w" zrobione={jest} zrob={zrob} />,
    <Ofertowka key="o" biuro={biuro} zrobione={jest} zrob={zrob} />,
    <Cele key="g" zrobione={jest} zrob={zrob} />,
    <Zespol key="z" ceo={ceo} zrobione={jest} zrob={zrob} />,
    <Koniec key="k" ceo={ceo} demo={demo} biuro={biuro} />,
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Logo rozmiar={28} ton="ciemny" />
          <span className="hidden text-xs leading-tight text-slate-500 sm:block">
            System pracy
            <br />
            dla biur nieruchomości
          </span>
        </div>
        {krok < KROKOW - 1 && (
          <Link href={demo ? "/app" : ceo ? "/app/start" : "/app"} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900">
            Pomiń samouczek
          </Link>
        )}
      </header>

      <main key={krok} className="mx-auto max-w-6xl px-4 pb-40 pt-6 sm:px-8 sm:pt-10">
        {kroki[krok]}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <div className="w-28">
            {krok > 0 && (
              <button type="button" onClick={wstecz} className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-900/5 hover:text-slate-900">
                ← Wstecz
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-lg ring-1 ring-slate-900/5">
            <div className="hidden gap-1 sm:flex" aria-hidden="true">
              {Array.from({ length: KROKOW }, (_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === krok ? "w-6 bg-emerald-600" : i < krok ? "w-1.5 bg-emerald-600/50" : "w-1.5 bg-slate-200"}`} />
              ))}
            </div>
            <span className="text-sm font-extrabold tabular-nums">
              {krok + 1}
              <span className="font-medium text-slate-400">/{KROKOW}</span>
            </span>
          </div>
          <div className="flex w-28 justify-end">
            {krok > 0 && krok < KROKOW - 1 && jest && (
              <button type="button" onClick={dalej} className="witaj-wejscie witaj-swiec rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-600">
                Dalej →
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
