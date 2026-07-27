"use client";

import { useState } from "react";

type Agent = { name: string; email: string; phone?: string; agency: string };
type Photo = { id: string; url: string };

const MAX_PHOTOS = 8;

// Parametry oferty. `options` → lista wyboru; brak → wpisywanie ręczne.
const PARAMS: { key: string; label: string; placeholder?: string; options?: string[] }[] = [
  { key: "area", label: "Powierzchnia (m²)", placeholder: "70" },
  { key: "rooms", label: "Liczba pokoi", placeholder: "3" },
  { key: "floor", label: "Piętro", placeholder: "2/4" },
  { key: "year", label: "Rok budowy", placeholder: "2014" },
  { key: "market", label: "Rynek", options: ["wtórny", "pierwotny"] },
  {
    key: "condition",
    label: "Standard",
    options: ["do wprowadzenia", "do odświeżenia", "do remontu", "stan deweloperski"],
  },
  { key: "heating", label: "Ogrzewanie", options: ["miejskie", "gazowe", "elektryczne", "kominkowe", "inne"] },
  { key: "ownership", label: "Forma własności", options: ["pełna własność", "spółdzielcze własnościowe", "udział"] },
  { key: "plot", label: "Działka (m²)", placeholder: "np. 450" },
  { key: "balcony", label: "Balkon / taras", options: ["balkon", "taras", "loggia", "ogródek", "brak"] },
  { key: "parking", label: "Parking", options: ["garaż podziemny", "miejsce naziemne", "w cenie", "brak"] },
  { key: "elevator", label: "Winda", options: ["tak", "nie"] },
  { key: "rent", label: "Czynsz administracyjny", placeholder: "900 zł/mc" },
  { key: "available", label: "Dostępne od", placeholder: "od zaraz" },
];

export function OfferBuilder({ agent }: { agent: Agent }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [params, setParams] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [preview, setPreview] = useState(false);

  function setParam(k: string, v: string) {
    setParams((p) => ({ ...p, [k]: v }));
  }
  function addPhotos(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const next = Array.from(files)
      .slice(0, room)
      .map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...next]);
  }
  function removePhoto(id: string) {
    setPhotos((p) => {
      const found = p.find((x) => x.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return p.filter((x) => x.id !== id);
    });
  }
  function print() {
    const prev = document.title;
    document.title = title ? `Oferta — ${title}` : "Oferta";
    window.print();
    setTimeout(() => (document.title = prev), 1000);
  }

  const hero = photos[0];
  const rest = photos.slice(1);
  const filledParams = PARAMS.filter((p) => (params[p.key] ?? "").trim());

  const sheetEl = (
    <div className="print-sheet mx-auto w-full max-w-[820px] rounded-2xl border-t-4 border-emerald-500 bg-white p-8 text-zinc-900 shadow-xl md:p-10">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" width={44} height={44} className="rounded-full" />
          <p className="text-sm font-semibold">{agent.agency}</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Oferta</span>
      </div>

      {hero ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={hero.url} alt="" className="mb-2 h-80 w-full rounded-xl object-cover" />
      ) : (
        <div className="mb-2 flex h-80 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400">
          Dodaj zdjęcia — pierwsze będzie główne
        </div>
      )}

      {rest.length > 0 && (
        <div className="mb-5 grid grid-cols-4 gap-2">
          {rest.map((p) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={p.id} src={p.url} alt="" className="h-20 w-full rounded-lg object-cover" />
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title || "Tytuł oferty"}</h1>
          {location && <p className="text-zinc-500">{location}</p>}
        </div>
        {price && <p className="whitespace-nowrap text-2xl font-bold text-emerald-700">{price}</p>}
      </div>

      {filledParams.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2.5 sm:grid-cols-3">
          {filledParams.map((p) => (
            <div key={p.key} className="border-b border-zinc-100 pb-1.5">
              <p className="text-[11px] uppercase tracking-wide text-zinc-400">{p.label}</p>
              <p className="font-medium text-zinc-900">{params[p.key]}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center gap-3 border-t border-zinc-200 pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={36} height={36} className="rounded-full" />
        <div className="text-sm">
          <p className="font-semibold text-zinc-900">{agent.name}</p>
          <p className="text-zinc-600">
            {agent.phone && <span className="font-medium text-emerald-700">tel. {agent.phone}</span>}
            {agent.phone && agent.email && " · "}
            {agent.email}
          </p>
        </div>
      </div>
    </div>
  );

  // Pełnoekranowy podgląd → czysty druk na całą stronę A4.
  if (preview) {
    return (
      <div>
        <div className="print-hide mb-4 flex items-center justify-between gap-4">
          <button
            onClick={() => setPreview(false)}
            className="inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-white"
          >
            ← Wróć do edycji
          </button>
          <button
            onClick={print}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Drukuj / Zapisz PDF
          </button>
        </div>
        {sheetEl}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,440px)_1fr]">
      <div className="print-hide space-y-5">
        <Section title="Zdjęcia (3–8)">
          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-zinc-700 py-4 text-sm text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400">
            + Dodaj zdjęcia z komputera
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />
          </label>
          {photos.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {photos.map((p) => (
                <div key={p.id} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-16 w-full rounded-lg object-cover" />
                  <button
                    onClick={() => removePhoto(p.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-500">{photos.length}/{MAX_PHOTOS} zdjęć</p>
        </Section>

        <Section title="Podstawa">
          <Field label="Tytuł oferty" value={title} onChange={setTitle} placeholder="3-pok z tarasem, Krowodrza" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cena" value={price} onChange={setPrice} placeholder="799 000 zł" />
            <Field label="Lokalizacja" value={location} onChange={setLocation} placeholder="Kraków, Krowodrza" />
          </div>
        </Section>

        <Section title="Parametry">
          <div className="grid grid-cols-2 gap-3">
            {PARAMS.map((p) =>
              p.options ? (
                <Select
                  key={p.key}
                  label={p.label}
                  value={params[p.key] ?? ""}
                  onChange={(v) => setParam(p.key, v)}
                  options={p.options}
                />
              ) : (
                <Field
                  key={p.key}
                  label={p.label}
                  value={params[p.key] ?? ""}
                  onChange={(v) => setParam(p.key, v)}
                  placeholder={p.placeholder}
                />
              ),
            )}
          </div>
        </Section>

        <button
          onClick={() => setPreview(true)}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Podgląd i PDF →
        </button>
      </div>

      <div className="lg:sticky lg:top-4 lg:h-fit">{sheetEl}</div>
    </div>
  );
}

const inp =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-800/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <div className="space-y-3">{children}</div>
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
    <div>
      <label className="mb-1.5 block text-sm text-zinc-400">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inp} />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-zinc-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inp}>
        <option value="">— wybierz —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
