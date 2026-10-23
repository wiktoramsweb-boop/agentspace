"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { label: string; city: string | null; street: string | null; streetName?: string | null; number?: string | null; district?: string | null; postcode?: string | null; lat: number; lng: number };

/**
 * Pole adresu z podpowiadaniem w trakcie pisania (lib/geocode.ts przez /api/geocode).
 * Zapisuje do formularza pola: address (widoczny tekst), city, street, lat, lng,
 * a po wyborze z listy także street_name, house_number, district i postcode.
 * Można wpisać dowolny tekst (zapisze się jako adres), a wybór z listy
 * dodatkowo ustawia miasto i współrzędne do mapy.
 */
export function AddressInput({
  label = "Adres",
  defaultAddress = "",
  defaultCity = "",
  defaultLat = "",
  defaultLng = "",
  placeholder = "Zacznij pisać, np. Warszawa Polna 12...",
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
  const [street, setStreet] = useState("");
  const [szczegoly, setSzczegoly] = useState({ streetName: "", number: "", district: "", postcode: "" });
  const [aktywny, setAktywny] = useState(-1);
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  // Po wyborze z listy i przy adresie wpisanym z góry nie odpalaj podpowiedzi sam z siebie.
  const skipRef = useRef(Boolean(defaultAddress));

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
    setStreet(s.street ?? "");
    setSzczegoly({ streetName: s.streetName ?? "", number: s.number ?? "", district: s.district ?? "", postcode: s.postcode ?? "" });
    setAktywny(-1);
    setLat(String(s.lat));
    setLng(String(s.lng));
    setItems([]);
    setOpen(false);
  }

  function onType(v: string) {
    setQuery(v);
    // Ręczna edycja adresu unieważnia poprzednie współrzędne i rozbicie adresu.
    setLat("");
    setLng("");
    setSzczegoly({ streetName: "", number: "", district: "", postcode: "" });
  }

  return (
    <div className="relative" ref={boxRef}>
      <label className="mb-1.5 block text-sm text-slate-500">{label}</label>
      <input
        value={query}
        onChange={(e) => onType(e.target.value)}
        onFocus={() => items.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAktywny((a) => Math.min(items.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setAktywny((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && aktywny >= 0) {
            e.preventDefault();
            pick(items[aktywny]);
          } else if (e.key === "Escape") setOpen(false);
        }}
        autoComplete="off"
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
      />
      {loading && (
        <span className="absolute right-3 top-9 text-xs text-slate-400">szukam…</span>
      )}
      {open && items.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {items.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => pick(s)}
                onMouseEnter={() => setAktywny(i)}
                className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm transition ${i === aktywny ? "bg-emerald-50 text-emerald-800" : "text-slate-700"}`}
              >
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                <span className="min-w-0">
                  <span className="block font-medium">{[s.streetName, s.number].filter(Boolean).join(" ") || s.city || s.label}</span>
                  <span className="block text-xs text-slate-500">{[s.district && s.district !== s.city ? s.district : null, s.city, s.postcode].filter(Boolean).join(" · ")}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* Ukryte pola przekazywane do server action */}
      <input type="hidden" name="address" value={query} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="street" value={street} />
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />
      <input type="hidden" name="street_name" value={szczegoly.streetName} />
      <input type="hidden" name="house_number" value={szczegoly.number} />
      <input type="hidden" name="district" value={szczegoly.district} />
      <input type="hidden" name="postcode" value={szczegoly.postcode} />
    </div>
  );
}
