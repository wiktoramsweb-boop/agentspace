"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { currentMiesiac } from "@/lib/oferta-pdf";
import { DOMYSLNY_WZOR, generujOferteWzor, type DaneOferty, type Marka, type WzorOferty } from "@/lib/oferta-wzor";
import { zapiszWzorOferty } from "./actions";

const KOLORY = ["#059669", "#1e3a8a", "#881337", "#1f2937", "#9a5b2b", "#0e7490"];

const pole = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none";

function Pole({ label, value, onChange, placeholder, wiele }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; wiele?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {wiele ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={wiele} placeholder={placeholder} className={pole} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={pole} />
      )}
    </label>
  );
}

/** Zdjęcie z dysku zamieniamy na JPEG do 1600 px: mniejszy PDF i każdy format, który zna przeglądarka. */
async function doJpeg(plik: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(plik);
  const s = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bitmap.width * s);
  c.height = Math.round(bitmap.height * s);
  c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((ok, zle) => c.toBlob((b) => (b ? ok(b) : zle(new Error("canvas"))), "image/jpeg", 0.86));
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Oferta współpracy dla biur bez własnego pliku. Lewa strona: dane klienta
 * i wzór biura, prawa: podgląd prawdziwego PDF, odświeżany po każdej zmianie.
 */
export function OfertaWzor({ wzorBiura, marka: markaStart, agent, telefon, email, ceo }: { wzorBiura: WzorOferty; marka: Marka; agent: string; telefon: string; email: string; ceo: boolean }) {
  const [wzor, setWzor] = useState(wzorBiura);
  const [kolor, setKolor] = useState(markaStart.kolor);
  const [dane, setDane] = useState<DaneOferty>({ adres: "", dla: "", miesiac: currentMiesiac(), agent, telefon, email, czas: "3 miesiące", prowizja: "2% brutto", uwagi: "" });
  const [zdjecie, setZdjecie] = useState<Uint8Array | null>(null);
  const [podglad, setPodglad] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [edycja, setEdycja] = useState(false);
  const [zapisuje, startZapisu] = useTransition();
  const [zapisano, setZapisano] = useState<string | null>(null);
  const ostatni = useRef<string | null>(null);

  const ustawDane = (p: Partial<DaneOferty>) => setDane((d) => ({ ...d, ...p }));
  const ustawWzor = (p: Partial<WzorOferty>) => {
    setWzor((w) => ({ ...w, ...p }));
    setZapisano(null);
  };

  useEffect(() => {
    let anulowane = false;
    const t = setTimeout(async () => {
      try {
        const b = await generujOferteWzor(wzor, dane, { ...markaStart, kolor }, zdjecie);
        if (anulowane) return;
        const url = URL.createObjectURL(new Blob([b.slice()], { type: "application/pdf" }));
        if (ostatni.current) URL.revokeObjectURL(ostatni.current);
        ostatni.current = url;
        setPodglad(url);
        setBlad(null);
      } catch (e) {
        if (!anulowane) setBlad(e instanceof Error ? e.message : "Nie udało się zbudować podglądu.");
      }
    }, 600);
    return () => {
      anulowane = true;
      clearTimeout(t);
    };
  }, [wzor, dane, kolor, zdjecie, markaStart]);

  function pobierz() {
    if (!podglad) return;
    const a = document.createElement("a");
    a.href = podglad;
    a.download = `Oferta wspolpracy - ${(dane.adres || "oferta").replace(/[\\/:*?"<>|]/g, "-")}.pdf`;
    a.click();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,440px)_1fr]">
      <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Dla kogo ta oferta</h2>
          <div className="space-y-3">
            <Pole label="Adres nieruchomości" value={dane.adres} onChange={(v) => ustawDane({ adres: v })} placeholder="ul. Długa 12/4, Kraków" />
            <Pole label="Właściciel (opcjonalnie)" value={dane.dla} onChange={(v) => ustawDane({ dla: v })} placeholder="Pani Anna Kowalska" />
            <div className="grid grid-cols-2 gap-3">
              <Pole label="Czas umowy" value={dane.czas} onChange={(v) => ustawDane({ czas: v })} />
              <Pole label="Wynagrodzenie" value={dane.prowizja} onChange={(v) => ustawDane({ prowizja: v })} />
            </div>
            <Pole label="Dodatkowe ustalenia (opcjonalnie)" value={dane.uwagi} onChange={(v) => ustawDane({ uwagi: v.slice(0, 500) })} wiele={3} placeholder="np. umowa na wyłączność, home staging w cenie" />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Zdjęcie na okładkę (np. salon tego mieszkania)</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setZdjecie(await doJpeg(f).catch(() => null));
                }}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Pole label="Agent" value={dane.agent} onChange={(v) => ustawDane({ agent: v })} />
              <Pole label="Telefon" value={dane.telefon} onChange={(v) => ustawDane({ telefon: v })} />
            </div>
            <Pole label="E-mail" value={dane.email} onChange={(v) => ustawDane({ email: v })} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white">
          <button type="button" onClick={() => setEdycja((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
            <span>
              <span className="block font-semibold text-slate-900">Wzór biura</span>
              <span className="text-xs text-slate-500">Kolor, teksty, etapy sprzedaży. {ceo ? "Ustawiasz raz dla całego zespołu." : "Ustawia CEO, zmiany tutaj dotyczą tylko tej oferty."}</span>
            </span>
            <span className="text-sm font-semibold text-emerald-700">{edycja ? "Zwiń" : "Dostosuj"}</span>
          </button>
          {edycja && (
            <div className="space-y-4 border-t border-slate-100 p-5">
              <div>
                <span className="mb-2 block text-xs font-medium text-slate-500">Kolor biura</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {KOLORY.map((k) => (
                    <button key={k} type="button" aria-label={`Kolor ${k}`} onClick={() => { setKolor(k); setZapisano(null); }} className={`h-9 w-9 rounded-full ring-offset-2 transition hover:scale-110 ${kolor === k ? "ring-2 ring-slate-400" : ""}`} style={{ background: k }} />
                  ))}
                  <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border border-dashed border-slate-300 text-center text-lg leading-9 text-slate-400" title="Własny kolor">
                    +
                    <input type="color" value={kolor} onChange={(e) => { setKolor(e.target.value); setZapisano(null); }} className="absolute inset-0 cursor-pointer opacity-0" />
                  </label>
                </div>
              </div>
              <Pole label="Tytuł" value={wzor.tytul} onChange={(v) => ustawWzor({ tytul: v })} />
              <Pole label="Hasło na okładce" value={wzor.podtytul} onChange={(v) => ustawWzor({ podtytul: v })} />
              <Pole label="O nas" value={wzor.oNas} onChange={(v) => ustawWzor({ oNas: v })} wiele={5} />
              <div>
                <span className="mb-2 block text-xs font-medium text-slate-500">Liczby biura (puste się nie pokażą, wpisuj tylko prawdziwe)</span>
                <div className="grid grid-cols-3 gap-2">
                  {wzor.liczby.map((l, i) => (
                    <div key={i} className="space-y-1">
                      <input value={l.wartosc} onChange={(e) => ustawWzor({ liczby: wzor.liczby.map((x, j) => (j === i ? { ...x, wartosc: e.target.value } : x)) })} placeholder="np. 12" className={pole} />
                      <input value={l.opis} onChange={(e) => ustawWzor({ liczby: wzor.liczby.map((x, j) => (j === i ? { ...x, opis: e.target.value } : x)) })} className={`${pole} text-xs`} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-2 block text-xs font-medium text-slate-500">Etapy sprzedaży</span>
                <div className="space-y-3">
                  {wzor.kroki.map((k, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: kolor }}>{i + 1}</span>
                        <input value={k.tytul} onChange={(e) => ustawWzor({ kroki: wzor.kroki.map((x, j) => (j === i ? { ...x, tytul: e.target.value } : x)) })} className={`${pole} py-1.5 font-semibold`} />
                        {wzor.kroki.length > 2 && (
                          <button type="button" onClick={() => ustawWzor({ kroki: wzor.kroki.filter((_, j) => j !== i) })} className="rounded-lg px-2 text-slate-400 hover:text-rose-600" aria-label="Usuń etap">✕</button>
                        )}
                      </div>
                      <textarea value={k.opis} onChange={(e) => ustawWzor({ kroki: wzor.kroki.map((x, j) => (j === i ? { ...x, opis: e.target.value } : x)) })} rows={2} className={`${pole} text-xs`} />
                    </div>
                  ))}
                  {wzor.kroki.length < 6 && (
                    <button type="button" onClick={() => ustawWzor({ kroki: [...wzor.kroki, { tytul: "Nowy etap", opis: "" }] })} className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-sm text-slate-500 hover:border-emerald-500 hover:text-emerald-700">
                      + Dodaj etap
                    </button>
                  )}
                </div>
              </div>
              <Pole label="W ramach współpracy (jedna rzecz w linii)" value={wzor.wCenie.join("\n")} onChange={(v) => ustawWzor({ wCenie: v.split("\n") })} wiele={6} />
              <Pole label="Zaproszenie na ostatniej stronie" value={wzor.zacheta} onChange={(v) => ustawWzor({ zacheta: v })} wiele={3} />
              <div className="flex flex-wrap items-center gap-3">
                {ceo && (
                  <button
                    type="button"
                    disabled={zapisuje}
                    onClick={() =>
                      startZapisu(async () => {
                        const r = await zapiszWzorOferty({ ...wzor, wCenie: wzor.wCenie.filter((w) => w.trim()) }, kolor);
                        setZapisano(r.ok ? "Zapisane dla całego biura." : (r.blad ?? "Nie udało się zapisać."));
                      })
                    }
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {zapisuje ? "Zapisuję..." : "Zapisz jako wzór biura"}
                  </button>
                )}
                <button type="button" onClick={() => { setWzor(DOMYSLNY_WZOR); setZapisano(null); }} className="text-sm text-slate-500 hover:text-slate-800">
                  Przywróć teksty domyślne
                </button>
                {zapisano && <span className="text-sm text-emerald-700">{zapisano}</span>}
              </div>
            </div>
          )}
        </section>

        <button type="button" onClick={pobierz} disabled={!podglad} className="w-full rounded-2xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
          Pobierz PDF
        </button>
        {blad && <p className="text-sm text-rose-600">{blad}</p>}
      </div>

      <div className="min-h-[70vh] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 xl:sticky xl:top-6 xl:h-[calc(100vh-6rem)]">
        {podglad ? <iframe title="Podgląd oferty" src={`${podglad}#view=FitH`} className="h-full min-h-[70vh] w-full" /> : <p className="p-6 text-sm text-slate-500">Buduję podgląd...</p>}
      </div>
    </div>
  );
}
