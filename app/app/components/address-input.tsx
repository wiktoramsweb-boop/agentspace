"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { label: string; city: string | null; lat: number; lng: number };

/**
 * Pole adresu z podpowiadaniem (darmowe OSM/Nominatim przez /api/geocode).
 * Zapisuje do formularza pola: address (widoczny tekst), city, lat, lng.
 * Można wpisać dowolny tekst (zapisze się jako adres), a wybór z listy
 * dodatkowo ustawia miasto i współrzędne do mapy.
 */
export function AddressInput({
  label = "Adres",
  defaultAddress = "",
  defaultCity = "",
  defaultLat = "",
  defaultLng = "",
  placeholder = "Zacznij pisać, np. Kraków Zbożowa 2...",
}: {
  label?: string;
  defaultAddress?: string;
  defaultCity?: string;
  defaultLat?: string;
  defaultLng?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(defaultAddress);
  const [city, setCity] = useState(defaultCity);
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(false); // po wyborze z listy nie odpalaj ponownie fetch

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setItems([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setItems(data.results ?? []);
        setOpen(true);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function pick(s: Suggestion) {
    skipRef.current = true;
    setQuery(s.label);
    setCity(s.city ?? "");
    setLat(String(s.lat));
    setLng(String(s.lng));
    setItems([]);
    setOpen(false);
  }

  function onType(v: string) {
    setQuery(v);
    // Ręczna edycja adresu unieważnia poprzednie współrzędne.
    setLat("");
    setLng("");
  }

  return (
    <div className="relative" ref={boxRef}>
      <label className="mb-1.5 block text-sm text-zinc-400">{label}</label>
      <input
        value={query}
        onChange={(e) => onType(e.target.value)}
        onFocus={() => items.length > 0 && setOpen(true)}
        autoComplete="off"
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
      />
      {loading && (
        <span className="absolute right-3 top-9 text-xs text-zinc-600">szukam…</span>
      )}
      {open && items.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
          {items.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="block w-full px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* Ukryte pola przekazywane do server action */}
      <input type="hidden" name="address" value={query} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />
    </div>
  );
}
