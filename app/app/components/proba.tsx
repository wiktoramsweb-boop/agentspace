import type { ReactNode } from "react";
import { NAZWA_PROBY, type RodzajProby, type StanProby } from "@/lib/proba";

function Klodka({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Przycisk dalej: biuro na próbie idzie do abonamentu, gość demo do rejestracji. */
function Dalej({ demo }: { demo: boolean }) {
  return demo ? (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- zwykły link: Link pobierałby adres z wyprzedzeniem, a to wylogowuje
    <a href="/demo-wyjdz?dalej=signup" className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
      Załóż konto za darmo
    </a>
  ) : (
    <a href="/app/ustawienia/abonament" className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
      Wybierz pakiet
    </a>
  );
}

/** Licznik podejść w wersji próbnej. Nic nie pokazuje biurom z abonamentem. */
export function LicznikProby({ stan, rodzaj }: { stan: StanProby; rodzaj: RodzajProby }) {
  if (!stan.naProbie) return null;
  if (stan.zostalo <= 0) return <BlokadaProby stan={stan} rodzaj={rodzaj} />;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
      <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">{stan.demo ? "DEMO" : "OKRES PRÓBNY"}</span>
      <span className="flex-1">
        Masz <b>{stan.zostalo} z {stan.limit}</b> {NAZWA_PROBY[rodzaj].mn} do przetestowania{stan.demo ? " na dziś" : ""}. Bez limitu w abonamencie.
      </span>
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: stan.limit }, (_, i) => (
          <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < stan.uzyte ? "bg-emerald-300" : "bg-emerald-600"}`} />
        ))}
      </span>
    </div>
  );
}

export function BlokadaProby({ stan, rodzaj }: { stan: StanProby; rodzaj: RodzajProby }) {
  return (
    <div className="mb-6 flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-white">
        <Klodka />
      </span>
      <p className="text-lg font-bold text-slate-900">Wykorzystano {stan.limit} {NAZWA_PROBY[rodzaj].mn} z wersji próbnej</p>
      <p className="max-w-md text-sm text-slate-600">
        {stan.demo
          ? "W demo limit odnawia się co dobę. Na własnym koncie masz pełny dostęp przez okres próbny, a w abonamencie bez limitu."
          : "W abonamencie korzystasz bez limitu. Twoje dotychczasowe wyniki i dane zostają."}
      </p>
      <Dalej demo={stan.demo} />
    </div>
  );
}

/**
 * Treść tylko dla abonamentu: zamazany podgląd i kłódka na wierzchu.
 * Podgląd jest prawdziwy, żeby było widać, co jest w środku.
 */
export function TylkoAbonament({ demo, tytul, opis, children }: { demo: boolean; tytul: string; opis: string; children: ReactNode }) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none max-h-[900px] select-none overflow-hidden blur-[6px] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
        {children}
      </div>
      <div className="absolute inset-x-0 top-24 flex justify-center px-4">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/95 px-6 py-8 text-center shadow-2xl backdrop-blur">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-white">
            <Klodka />
          </span>
          <p className="text-lg font-bold text-slate-900">{tytul}</p>
          <p className="text-sm text-slate-600">{opis}</p>
          <Dalej demo={demo} />
        </div>
      </div>
    </div>
  );
}
