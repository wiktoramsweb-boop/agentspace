"use client";

import { useState } from "react";
import { generujFakturePdf, type DaneFaktury } from "@/lib/invoice-pdf";
import { pobierzPdf } from "@/lib/pdf-kit";
import { opisRodzaju, type Seller } from "@/lib/invoice";

/** Nazwa pliku: rodzaj dokumentu i numer bez ukośników. */
function nazwaPlikuFaktury(d: DaneFaktury): string {
  return `${opisRodzaju(d.docType).nazwa}-${d.number.replaceAll("/", "-")}`;
}

/**
 * Wysyłka faktury mailem do nabywcy.
 *
 * PDF składamy tutaj, w przeglądarce, i dopiero gotowy plik idzie na serwer.
 * Ten sam generator obsługuje przycisk „Pobierz PDF”, więc klient dostaje
 * dokładnie ten plik, który agent widzi u siebie.
 */
function doBase64(bytes: Uint8Array): string {
  let binarne = "";
  // Po kawałku, bo String.fromCharCode z kilkudziesięcioma tysiącami argumentów
  // naraz przepełnia stos wywołań.
  const krok = 8192;
  for (let i = 0; i < bytes.length; i += krok) {
    binarne += String.fromCharCode(...bytes.subarray(i, i + krok));
  }
  return btoa(binarne);
}

export function WyslijMailem({
  invoiceId,
  dane,
  sprzedawca,
  stopka,
  logoUrl,
  nazwaBiura,
  domyslnyEmail,
}: {
  invoiceId: string;
  dane: DaneFaktury;
  sprzedawca: Seller;
  stopka?: string;
  logoUrl?: string | null;
  nazwaBiura?: string;
  domyslnyEmail?: string | null;
}) {
  const [otwarte, setOtwarte] = useState(false);
  const [email, setEmail] = useState(domyslnyEmail ?? "");
  const [wiadomosc, setWiadomosc] = useState("");
  const [stan, setStan] = useState<"gotowe" | "pracuje" | "wyslane">("gotowe");
  const [blad, setBlad] = useState<string | null>(null);

  async function pobierz() {
    const bytes = await generujFakturePdf(dane, sprzedawca, { stopka, logoUrl, nazwaBiura });
    pobierzPdf(bytes, `${nazwaPlikuFaktury(dane)}.pdf`);
  }

  async function wyslij() {
    setBlad(null);
    setStan("pracuje");
    try {
      const bytes = await generujFakturePdf(dane, sprzedawca, { stopka, logoUrl, nazwaBiura });
      const res = await fetch("/api/faktury/wyslij", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invoiceId, email, wiadomosc, pdf: doBase64(bytes) }),
      });
      const odp = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(odp.error ?? "Nie udało się wysłać.");
      setStan("wyslane");
    } catch (e) {
      setBlad(e instanceof Error ? e.message : "Nie udało się wysłać.");
      setStan("gotowe");
    }
  }

  return (
    <div className="print-hide">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={pobierz}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:border-slate-300"
        >
          Zapisz PDF
        </button>
        <button
          onClick={() => setOtwarte((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Wyślij mailem
        </button>
      </div>

      {otwarte && (
        <div className="mt-3 max-w-md rounded-2xl border border-slate-200 bg-white p-4">
          {stan === "wyslane" ? (
            <div className="text-sm">
              <p className="font-medium text-emerald-700">Wysłane na {email}.</p>
              <button
                onClick={() => {
                  setStan("gotowe");
                  setOtwarte(false);
                }}
                className="mt-3 text-slate-500 underline"
              >
                Zamknij
              </button>
            </div>
          ) : (
            <>
              <label className="mb-1 block text-xs font-medium text-slate-500">Adres nabywcy</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="klient@example.pl"
                className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Wiadomość (opcjonalnie)
              </label>
              <textarea
                value={wiadomosc}
                onChange={(e) => setWiadomosc(e.target.value)}
                rows={3}
                placeholder="W razie pytań proszę o kontakt."
                className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
              {blad && <p className="mb-2 text-sm text-red-600">{blad}</p>}
              <button
                onClick={wyslij}
                disabled={stan === "pracuje" || !email}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {stan === "pracuje" ? "Wysyłam..." : "Wyślij fakturę"}
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Załącznikiem idzie ten sam plik, który zapisujesz przyciskiem obok.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
