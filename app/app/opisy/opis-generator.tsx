"use client";

import { useMemo, useState } from "react";
import {
  generateListing,
  type OpisInput,
  type Pomieszczenie,
  type Transakcja,
} from "@/lib/opis";

type PropertyPrefill = {
  id: string;
  title: string;
  deal_kind: string;
  city: string | null;
  address: string | null;
  price_pln: number | null;
  area_m2: number | null;
  rooms: number | null;
};

const EMPTY: OpisInput = {
  transakcja: "sprzedaz",
  typLabel: "MIESZKANIE",
  customTitle: "",
  pokoje: "",
  metraz: "",
  miasto: "Kraków",
  dzielnica: "",
  ulica: "",
  naglowekAtut: "",
  intro: "",
  klucze: true,
  status: "",
  pietro: "",
  budynek: "",
  rokBudowy: "",
  ogrzewanie: "",
  stanPrawny: "",
  ukladWstep: "",
  rooms: [{ name: "", area: "", desc: "" }],
  atuty: [""],
  lokalizacjaWstep: "",
  komunikacja: "",
  zielen: "",
  infrastruktura: "",
  potencjal: "",
  cena: "",
  cenaDodatki: "",
  czynszAdmin: "",
  media: "",
  kaucja: "",
  rekomendacja: "",
  dostepnosc: "",
  english: true,
};

export function OpisGenerator({ properties }: { properties: PropertyPrefill[] }) {
  const [i, setI] = useState<OpisInput>(EMPTY);
  const [copied, setCopied] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templateOutput = useMemo(() => generateListing(i), [i]);
  // Gdy AI (lub ręczna edycja) nadpisze tekst — pokazujemy jego wersję,
  // inaczej podgląd składany na żywo z pól.
  const output = aiText !== null ? aiText : templateOutput;

  async function generateAI() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/opis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(i),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się wygenerować.");
      } else {
        setAiText(data.text);
      }
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  function set<K extends keyof OpisInput>(key: K, value: OpisInput[K]) {
    setI((prev) => ({ ...prev, [key]: value }));
  }

  function prefill(id: string) {
    const p = properties.find((x) => x.id === id);
    if (!p) return;
    setI((prev) => ({
      ...prev,
      transakcja: p.deal_kind === "wynajem" ? "wynajem" : "sprzedaz",
      customTitle: p.title ?? prev.customTitle,
      metraz: p.area_m2 != null ? String(p.area_m2) : prev.metraz,
      pokoje: p.rooms != null ? String(p.rooms) : prev.pokoje,
      miasto: p.city ?? prev.miasto,
      ulica: p.address ?? prev.ulica,
      cena: p.price_pln != null ? `${p.price_pln.toLocaleString("pl-PL")} zł` : prev.cena,
    }));
  }

  // Pomieszczenia (dynamiczna lista)
  function setRoom(idx: number, patch: Partial<Pomieszczenie>) {
    setI((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r, n) => (n === idx ? { ...r, ...patch } : r)),
    }));
  }
  function addRoom() {
    setI((prev) => ({ ...prev, rooms: [...prev.rooms, { name: "", area: "", desc: "" }] }));
  }
  function removeRoom(idx: number) {
    setI((prev) => ({ ...prev, rooms: prev.rooms.filter((_, n) => n !== idx) }));
  }

  // Atuty (dynamiczna lista)
  function setAtut(idx: number, value: string) {
    setI((prev) => ({ ...prev, atuty: prev.atuty.map((a, n) => (n === idx ? value : a)) }));
  }
  function addAtut() {
    setI((prev) => ({ ...prev, atuty: [...prev.atuty, ""] }));
  }
  function removeAtut(idx: number) {
    setI((prev) => ({ ...prev, atuty: prev.atuty.filter((_, n) => n !== idx) }));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const sprzedaz = i.transakcja === "sprzedaz";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* LEWA: formularz */}
      <div className="space-y-6">
        {/* Podstawa */}
        <Section title="Podstawa">
          <div className="flex gap-2">
            <TransButton
              active={sprzedaz}
              label="Sprzedaż"
              onClick={() => set("transakcja", "sprzedaz" as Transakcja)}
            />
            <TransButton
              active={!sprzedaz}
              label="Wynajem"
              onClick={() => set("transakcja", "wynajem" as Transakcja)}
            />
          </div>

          {properties.length > 0 && (
            <Labeled label="Wczytaj z nieruchomości (podstawi dane)">
              <select
                onChange={(e) => prefill(e.target.value)}
                defaultValue=""
                className={selectCls}
              >
                <option value="">— wybierz ofertę —</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Labeled>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Typ (MIESZKANIE/DOM)" value={i.typLabel} onChange={(v) => set("typLabel", v)} />
            <Field label="Liczba pokoi" value={i.pokoje} onChange={(v) => set("pokoje", v)} placeholder="3" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Metraż (m²)" value={i.metraz} onChange={(v) => set("metraz", v)} placeholder="70,26" />
            <Field label="Piętro" value={i.pietro} onChange={(v) => set("pietro", v)} placeholder="2 z 4" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Miasto" value={i.miasto} onChange={(v) => set("miasto", v)} />
            <Field label="Dzielnica" value={i.dzielnica} onChange={(v) => set("dzielnica", v)} placeholder="Wzgórza Krzesławickie" />
            <Field label="Ulica" value={i.ulica} onChange={(v) => set("ulica", v)} placeholder="ul. Niebyła" />
          </div>
          <Field
            label="Dopisek do tytułu (atut)"
            value={i.naglowekAtut}
            onChange={(v) => set("naglowekAtut", v)}
            placeholder="Z 20 m² TARASEM, GARAŻEM I KOMÓRKĄ"
          />
          <Field
            label="Własny tytuł (opcjonalnie — nadpisuje powyższe)"
            value={i.customTitle}
            onChange={(v) => set("customTitle", v)}
          />
        </Section>

        {/* Wstęp */}
        <Section title="Wstęp">
          <Area
            label="Akapit wprowadzający"
            value={i.intro}
            onChange={(v) => set("intro", v)}
            placeholder="Prezentujemy przestronne, w pełni rozkładowe mieszkanie..."
            rows={4}
          />
          <Toggle label="Dopisz zdanie 'Mamy klucze — prezentacja także wieczorami i w weekendy'" checked={i.klucze} onChange={(v) => set("klucze", v)} />
        </Section>

        {/* Podstawowe informacje */}
        <Section title="Podstawowe informacje">
          <Field label="Status" value={i.status} onChange={(v) => set("status", v)} placeholder="Gotowe do wprowadzenia, nowocześnie wykończone" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Budynek" value={i.budynek} onChange={(v) => set("budynek", v)} placeholder="Kameralny blok, winda" />
            <Field label="Rok budowy" value={i.rokBudowy} onChange={(v) => set("rokBudowy", v)} placeholder="2014" />
          </div>
          <Field label="Ogrzewanie" value={i.ogrzewanie} onChange={(v) => set("ogrzewanie", v)} placeholder="Miejskie, bez instalacji gazowej" />
          <Field label="Stan prawny" value={i.stanPrawny} onChange={(v) => set("stanPrawny", v)} placeholder="Pełna własność z KW, bez obciążeń" />
        </Section>

        {/* Układ pomieszczeń */}
        <Section title="Układ pomieszczeń">
          <Area label="Zdanie wprowadzające (opcjonalnie)" value={i.ukladWstep} onChange={(v) => set("ukladWstep", v)} rows={2} placeholder="Mieszkanie zaprojektowano w pełni rozkładowo..." />
          <div className="space-y-3">
            {i.rooms.map((r, idx) => (
              <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <div className="mb-2 flex gap-2">
                  <input
                    value={r.name}
                    onChange={(e) => setRoom(idx, { name: e.target.value })}
                    placeholder="Salon"
                    className={inputCls + " flex-1"}
                  />
                  <input
                    value={r.area}
                    onChange={(e) => setRoom(idx, { area: e.target.value })}
                    placeholder="m²"
                    className={inputCls + " w-20"}
                  />
                  <button onClick={() => removeRoom(idx)} className="px-2 text-zinc-600 hover:text-red-400" title="Usuń">
                    ✕
                  </button>
                </div>
                <input
                  value={r.desc}
                  onChange={(e) => setRoom(idx, { desc: e.target.value })}
                  placeholder="Opis pomieszczenia (opcjonalnie)"
                  className={inputCls + " w-full"}
                />
              </div>
            ))}
          </div>
          <AddButton label="+ Dodaj pomieszczenie" onClick={addRoom} />
        </Section>

        {/* Atuty */}
        <Section title="Dodatkowe atuty">
          <div className="space-y-2">
            {i.atuty.map((a, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={a}
                  onChange={(e) => setAtut(idx, e.target.value)}
                  placeholder="Ogrzewanie miejskie — niższe koszty, brak przeglądów gazowych"
                  className={inputCls + " flex-1"}
                />
                <button onClick={() => removeAtut(idx)} className="px-2 text-zinc-600 hover:text-red-400" title="Usuń">
                  ✕
                </button>
              </div>
            ))}
          </div>
          <AddButton label="+ Dodaj atut" onClick={addAtut} />
        </Section>

        {/* Lokalizacja */}
        <Section title="Lokalizacja">
          <Area label="Wstęp o okolicy" value={i.lokalizacjaWstep} onChange={(v) => set("lokalizacjaWstep", v)} rows={3} />
          <Area label="Komunikacja i dojazd" value={i.komunikacja} onChange={(v) => set("komunikacja", v)} rows={3} placeholder="* Autobusy: linie 122, 149...&#10;* Tramwaj: 15 min do pętli..." />
          <Area label="Zieleń i rekreacja" value={i.zielen} onChange={(v) => set("zielen", v)} rows={3} />
          <Area label="Infrastruktura codzienna" value={i.infrastruktura} onChange={(v) => set("infrastruktura", v)} rows={3} />
        </Section>

        {/* Potencjał inwestycyjny (tylko sprzedaż) */}
        {sprzedaz && (
          <Section title="Potencjał inwestycyjny (opcjonalnie)">
            <Area label="Analiza / perspektywy dzielnicy" value={i.potencjal} onChange={(v) => set("potencjal", v)} rows={4} />
          </Section>
        )}

        {/* Finanse */}
        <Section title={sprzedaz ? "Finanse i stan prawny" : "Finanse i warunki najmu"}>
          <Field label={sprzedaz ? "Cena" : "Odstępne (czynsz najmu)"} value={i.cena} onChange={(v) => set("cena", v)} placeholder={sprzedaz ? "799 000 zł (11 371 zł/m²)" : "2 500 zł (do negocjacji)"} />
          {sprzedaz ? (
            <Field label="Dodatkowo (garaż, komórka...)" value={i.cenaDodatki} onChange={(v) => set("cenaDodatki", v)} placeholder="Miejsce w garażu + komórka: 50 000 zł" />
          ) : (
            <Field label="Kaucja" value={i.kaucja} onChange={(v) => set("kaucja", v)} placeholder="2 500 zł (równowartość 1 miesiąca)" />
          )}
          <Field label="Czynsz administracyjny" value={i.czynszAdmin} onChange={(v) => set("czynszAdmin", v)} placeholder="ok. 900 zł/mies." />
          <Field label="Media" value={i.media} onChange={(v) => set("media", v)} placeholder="Prąd wg licznika, bez gazu" />
        </Section>

        {/* Domknięcie */}
        <Section title="Zakończenie">
          <Area label="Nasza rekomendacja" value={i.rekomendacja} onChange={(v) => set("rekomendacja", v)} rows={3} />
          <Field label="Dostępność / wezwanie do kontaktu" value={i.dostepnosc} onChange={(v) => set("dostepnosc", v)} placeholder="Mieszkanie dostępne od zaraz. Zadzwoń lub napisz!" />
          <Toggle label="Dopisz 'We speak English!'" checked={i.english} onChange={(v) => set("english", v)} />
          <p className="text-xs text-zinc-500">
            Zakończenie Spectra oraz klauzula prawna dodają się automatycznie (wersja dla{" "}
            {sprzedaz ? "sprzedaży" : "najmu"}).
          </p>
        </Section>
      </div>

      {/* PRAWA: podgląd */}
      <div className="lg:sticky lg:top-4 lg:h-fit">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Gotowy opis
          </h2>
          <button
            onClick={copy}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            {copied ? "Skopiowano ✓" : "Kopiuj"}
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            onClick={generateAI}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "AI pisze opis…" : "✨ Napisz przez AI"}
          </button>
          {aiText !== null && (
            <button
              onClick={() => setAiText(null)}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              Wróć do szablonu
            </button>
          )}
        </div>

        {error && (
          <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <textarea
          value={output}
          onChange={(e) => setAiText(e.target.value)}
          className="h-[70vh] w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-200 focus:border-emerald-500 focus:outline-none"
        />
        <p className="mt-2 text-xs text-zinc-500">
          ✨ AI napisze układ, atuty, lokalizację, potencjał i rekomendację z podanych danych.
          Tekst możesz dowolnie edytować. <span className="text-amber-400/80">Zweryfikuj szczegóły
          (linie, odległości, ceny) przed publikacją.</span>
        </p>
      </div>
    </div>
  );
}

/* ---------- małe komponenty pomocnicze ---------- */

const inputCls =
  "rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none";
const selectCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Labeled label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls + " w-full"}
      />
    </Labeled>
  );
}

function Area({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Labeled label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={inputCls + " w-full resize-y"}
      />
    </Labeled>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-emerald-500"
      />
      {label}
    </label>
  );
}

function TransButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-emerald-500 text-zinc-950"
          : "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-dashed border-zinc-700 py-2 text-sm text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400"
    >
      {label}
    </button>
  );
}
