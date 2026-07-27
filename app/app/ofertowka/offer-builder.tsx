"use client";

import { useState } from "react";

type Agent = { name: string; email: string; phone?: string; agency: string };
type Photo = { id: string; url: string };

const MAX_PHOTOS = 8;

export function OfferBuilder({ agent }: { agent: Agent }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [rooms, setRooms] = useState("");
  const [floor, setFloor] = useState("");
  const [year, setYear] = useState("");
  const [heating, setHeating] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);

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

  const params = [
    area && `${area} m²`,
    rooms && `${rooms} pok.`,
    floor && `piętro ${floor}`,
    year && `rok ${year}`,
    heating && heating,
  ].filter(Boolean);

  const hero = photos[0];
  const rest = photos.slice(1);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      {/* FORMULARZ */}
      <div className="print-hide space-y-5">
        <Section title="Zdjęcia (3–8)">
          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-zinc-700 py-4 text-sm text-zinc-400 transition hover:border-emerald-500 hover:text-emerald-400">
            + Dodaj zdjęcia z komputera
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addPhotos(e.target.files)}
            />
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
          <div className="grid grid-cols-3 gap-3">
            <Field label="Metraż (m²)" value={area} onChange={setArea} placeholder="70" />
            <Field label="Pokoje" value={rooms} onChange={setRooms} placeholder="3" />
            <Field label="Piętro" value={floor} onChange={setFloor} placeholder="2/4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rok budowy" value={year} onChange={setYear} placeholder="2014" />
            <Field label="Ogrzewanie" value={heating} onChange={setHeating} placeholder="miejskie" />
          </div>
        </Section>

        <Section title="Opis (wklej z ogłoszenia)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={7}
            placeholder="Wklej tu opis i parametry skopiowane z OLX / Otodom…"
            className={inp}
          />
        </Section>

        <button
          onClick={print}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Drukuj / Zapisz PDF
        </button>
      </div>

      {/* PODGLĄD */}
      <div className="lg:sticky lg:top-4 lg:h-fit">
        <div className="print-sheet mx-auto w-full max-w-[760px] rounded-2xl border-t-4 border-emerald-500 bg-white p-8 text-zinc-900 shadow-xl md:p-10">
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
            <img src={hero.url} alt="" className="mb-3 h-72 w-full rounded-xl object-cover" />
          ) : (
            <div className="mb-3 flex h-72 w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-400">
              Dodaj zdjęcia — pierwsze będzie główne
            </div>
          )}

          {rest.length > 0 && (
            <div className="mb-4 grid grid-cols-4 gap-2">
              {rest.map((p) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={p.id} src={p.url} alt="" className="h-20 w-full rounded-lg object-cover" />
              ))}
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title || "Tytuł oferty"}</h1>
              {location && <p className="text-sm text-zinc-500">{location}</p>}
            </div>
            {price && <p className="whitespace-nowrap text-2xl font-bold text-emerald-700">{price}</p>}
          </div>

          {params.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {params.map((p, i) => (
                <span key={i} className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  {p}
                </span>
              ))}
            </div>
          )}

          {description && (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{description}</p>
          )}

          <div className="mt-8 border-t border-zinc-200 pt-4 text-sm">
            <p className="font-semibold text-zinc-900">{agent.name}</p>
            <p className="text-zinc-500">
              {agent.phone && `tel. ${agent.phone}`}
              {agent.phone && agent.email && " · "}
              {agent.email}
            </p>
          </div>
        </div>
      </div>
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
