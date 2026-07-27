"use client";

import { useState } from "react";

type Agent = { name: string; email: string; phone?: string; agency: string };
type Photo = { id: string; url: string };

const MAX_PHOTOS = 8;

// Parametry oferty. `options` → lista wyboru; brak → wpisywanie ręczne.
// `suffix` doklejany na karcie (np. m², zł/mc). `icon` pokazywany przy parametrze.
const PARAMS: {
  key: string;
  label: string;
  placeholder?: string;
  options?: string[];
  suffix?: string;
  icon: string;
}[] = [
  { key: "area", label: "Powierzchnia", placeholder: "70", suffix: " m²", icon: "area" },
  { key: "rooms", label: "Liczba pokoi", placeholder: "3", icon: "home" },
  { key: "floor", label: "Piętro", placeholder: "2/4", icon: "building" },
  { key: "year", label: "Rok budowy", placeholder: "2014", icon: "calendar" },
  { key: "market", label: "Rynek", options: ["wtórny", "pierwotny"], icon: "tag" },
  {
    key: "condition",
    label: "Standard",
    options: ["do wprowadzenia", "do odświeżenia", "do remontu", "stan deweloperski"],
    icon: "sparkles",
  },
  { key: "heating", label: "Ogrzewanie", options: ["miejskie", "gazowe", "elektryczne", "kominkowe", "inne"], icon: "fire" },
  { key: "ownership", label: "Forma własności", options: ["pełna własność", "spółdzielcze własnościowe", "udział"], icon: "doc" },
  { key: "plot", label: "Działka", placeholder: "np. 450", suffix: " m²", icon: "map" },
  { key: "balcony", label: "Balkon / taras", options: ["balkon", "taras", "loggia", "ogródek", "brak"], icon: "sun" },
  { key: "parking", label: "Parking", options: ["garaż podziemny", "miejsce naziemne", "w cenie", "brak"], icon: "truck" },
  { key: "elevator", label: "Winda", options: ["tak", "nie"], icon: "elevator" },
  { key: "rent", label: "Czynsz administracyjny", placeholder: "900", suffix: " zł/mc", icon: "cash" },
  { key: "available", label: "Dostępne od", placeholder: "od zaraz", icon: "key" },
];

// Liniowe ikony (Heroicons outline) — spójne z panelem, profesjonalne.
const ICON_PATHS: Record<string, string> = {
  area: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
  home: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  building: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
  calendar: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
  tag: "M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z",
  sparkles: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
  fire: "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.048 8.287 8.287 0 0 0 9 9.6a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z",
  doc: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  map: "M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0Z",
  sun: "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z",
  truck: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-6m-6.75-3h11.25c.621 0 1.125-.504 1.125-1.125v-6.75c0-.621-.504-1.125-1.125-1.125H4.5c-.621 0-1.125.504-1.125 1.125v6.75c0 .621.504 1.125 1.125 1.125Z",
  elevator: "M7.5 9 12 4.5 16.5 9M7.5 15 12 19.5 15.75 15",
  cash: "M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  key: "M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z",
  pin: "M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z",
  phone: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z",
  mail: "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75",
};

function Icon({ name, className }: { name: string; className?: string }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  const multi = name === "pin";
  return (
    <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      {multi ? (
        d.split(" M").map((seg, i) => (
          <path key={i} strokeLinecap="round" strokeLinejoin="round" d={(i === 0 ? seg : "M" + seg)} />
        ))
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      )}
    </svg>
  );
}

function paramDisplay(value: string, suffix?: string): string {
  const v = value.trim();
  if (!suffix) return v;
  // nie doklejaj jednostki, jeśli już jest
  if (/m²|zł|%|mc/i.test(v)) return v;
  return v + suffix;
}

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
  const priceShown = price.trim() ? (/zł|pln/i.test(price) ? price.trim() : `${price.trim()} zł`) : "";

  const sheetEl = (
    <div className="print-sheet sheet-a4 mx-auto w-full max-w-[820px] rounded-2xl border-t-4 border-emerald-500 bg-white p-8 text-zinc-900 shadow-xl md:p-10">
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" width={44} height={44} className="rounded-full" />
          <p className="text-sm font-semibold">{agent.agency}</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Oferta</span>
      </div>

      {hero ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={hero.url} alt="" className="mb-2 h-60 w-full rounded-xl object-cover" />
      ) : (
        <div className="mb-2 flex h-60 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400">
          Dodaj zdjęcia — pierwsze będzie główne
        </div>
      )}

      {rest.length > 0 && (
        <div className="mb-4 grid grid-cols-4 gap-2">
          {rest.map((p) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={p.id} src={p.url} alt="" className="h-16 w-full rounded-lg object-cover" />
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title || "Tytuł oferty"}</h1>
          {location && (
            <p className="mt-0.5 flex items-center gap-1.5 text-zinc-500">
              <Icon name="pin" className="h-4 w-4 text-zinc-400" /> {location}
            </p>
          )}
        </div>
        {price && <p className="whitespace-nowrap text-2xl font-bold text-emerald-700">{priceShown}</p>}
      </div>

      {filledParams.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {filledParams.map((p) => (
            <div key={p.key} className="flex items-center gap-2.5 rounded-lg bg-zinc-50 px-3 py-2">
              <Icon name={p.icon} className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">{p.label}</p>
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {paramDisplay(params[p.key], p.suffix)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 border-t border-zinc-200 pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" width={40} height={40} className="rounded-full" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-zinc-900">{agent.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-zinc-600">
            {agent.phone && (
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <Icon name="phone" className="h-4 w-4" /> {agent.phone}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Icon name="mail" className="h-4 w-4 text-zinc-400" /> {agent.email}
            </span>
          </div>
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
