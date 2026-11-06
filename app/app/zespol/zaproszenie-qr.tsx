"use client";

import { useEffect, useState, useTransition } from "react";
import { useToast } from "../components/toast";
import { wyslijPonownieZaproszenie } from "./actions";

/**
 * Kod QR z zaproszeniem: nowa osoba skanuje go telefonem przy biurku i od razu
 * zakłada konto, bez czekania na maila. Tło kodu jest zawsze białe (także
 * w ciemnym motywie), bo aparaty gorzej czytają jasny kod na ciemnym tle.
 */
export function KodZaproszenia({ link, qr, rozmiar = 208 }: { link: string; qr: string; rozmiar?: number }) {
  const toast = useToast();
  const [skopiowany, setSkopiowany] = useState(false);
  // Sprawdzane po załadowaniu, żeby serwer i przeglądarka wyrenderowały to samo.
  const [moznaUdostepnic, setMoznaUdostepnic] = useState(false);
  useEffect(() => setMoznaUdostepnic(typeof navigator.share === "function"), []);

  const kopiuj = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setSkopiowany(true);
      toast("Skopiowano link zaproszenia");
      setTimeout(() => setSkopiowany(false), 2000);
    } catch {
      toast("Nie udało się skopiować", "error");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="flex-shrink-0 rounded-2xl border border-slate-200 p-3" style={{ background: "#ffffff", width: rozmiar + 26 }}>
        <div aria-label="Kod QR zaproszenia" role="img" dangerouslySetInnerHTML={{ __html: qr }} />
      </div>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="font-semibold text-slate-900">Zeskanuj aparatem w telefonie</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">Telefon otworzy stronę zaproszenia, a nowa osoba założy konto z nadaną rolą. Kod działa 14 dni.</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
          <button type="button" onClick={kopiuj} className="rounded-xl bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400">
            {skopiowany ? "Skopiowano ✓" : "Kopiuj link"}
          </button>
          {moznaUdostepnic && (
            <button
              type="button"
              onClick={() => navigator.share({ title: "Zaproszenie do AgentSpace", text: "Dołącz do naszego zespołu w AgentSpace:", url: link }).catch(() => {})}
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Wyślij SMS-em lub WhatsAppem
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Wiersz oczekującego zaproszenia: kod QR na żądanie i ponowna wysyłka maila. */
export function AkcjeZaproszenia({ id, link, qr }: { id: string; link: string; qr: string }) {
  const toast = useToast();
  const [otwarty, setOtwarty] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" onClick={() => setOtwarty((x) => !x)} className="text-xs font-medium text-emerald-600 transition hover:text-emerald-700">
        {otwarty ? "Ukryj kod" : "Kod QR"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await wyslijPonownieZaproszenie(id);
            toast(r.komunikat, r.ok ? undefined : "error");
          })
        }
        className="text-xs font-medium text-slate-500 transition hover:text-slate-900 disabled:opacity-50"
      >
        {pending ? "Wysyłam…" : "Wyślij mail ponownie"}
      </button>
      {otwarty && (
        <div className="order-last mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <KodZaproszenia link={link} qr={qr} rozmiar={176} />
        </div>
      )}
    </>
  );
}
