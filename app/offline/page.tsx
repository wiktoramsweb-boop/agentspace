import type { Metadata } from "next";
import { RetryButton } from "./retry-button";

export const metadata: Metadata = {
  title: "Brak połączenia | AgentSpace",
  robots: { index: false, follow: false },
};

/**
 * Ekran pokazywany przez service workera, gdy telefon stracił zasięg.
 *
 * Musi być samowystarczalny: żadnych danych z serwera, bo w tym momencie
 * i tak nie ma jak ich pobrać. Zadanie tej strony to powiedzieć wprost, co
 * się stało, i dać jeden przycisk do ponowienia.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
        <span
          aria-hidden="true"
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
        >
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" d="M2 8.8a16 16 0 0 1 20 0M5.5 12.3a11 11 0 0 1 13 0M9 15.8a6 6 0 0 1 6 0" />
            <path strokeLinecap="round" d="M12 19.5h.01M3 3l18 18" />
          </svg>
        </span>

        <h1 className="mb-3 text-2xl font-semibold text-slate-900">Brak połączenia</h1>
        <p className="mb-6 text-[0.9375rem] leading-relaxed text-slate-600">
          Telefon stracił zasięg albo Wi-Fi się rozłączyło. AgentSpace potrzebuje
          połączenia, żeby pokazać aktualne dane biura.
        </p>

        <div className="mb-7 rounded-2xl bg-slate-50 p-4 text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Zanim wrócisz do zasięgu
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li>Zapisz ustalenia w notatkach telefonu i przepisz je później.</li>
            <li>Numer klienta masz w historii połączeń.</li>
            <li>Powiadomienia dojdą, gdy tylko sieć wróci.</li>
          </ul>
        </div>

        <RetryButton />
      </div>
    </main>
  );
}
