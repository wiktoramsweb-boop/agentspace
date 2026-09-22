"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Ulubione oferty odwiedzającego. Siedzą w przeglądarce, więc działają bez
 * logowania; w prawdziwej stronie biura ta sama lista trafia do CRM razem z
 * zapytaniem, dzięki czemu agent widzi, co klient oglądał przed telefonem.
 */
const EVENT = "wz-fav-change";

function key(base: string) {
  return `wz-fav-${base}`;
}

function read(base: string): string[] {
  try {
    const raw = localStorage.getItem(key(base));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites(base: string) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read(base));
    const sync = () => setIds(read(base));
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [base]);

  const toggle = useCallback(
    (id: string) => {
      const next = read(base).includes(id) ? read(base).filter((x) => x !== id) : [...read(base), id];
      try {
        localStorage.setItem(key(base), JSON.stringify(next));
      } catch {
        // tryb prywatny: ulubione działają do przeładowania strony
      }
      setIds(next);
      window.dispatchEvent(new Event(EVENT));
    },
    [base],
  );

  return { ids, toggle, has: (id: string) => ids.includes(id) };
}

export function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path d="M12 20.5s-7.5-4.7-7.5-10a4.2 4.2 0 0 1 7.5-2.6 4.2 4.2 0 0 1 7.5 2.6c0 5.3-7.5 10-7.5 10Z" strokeLinejoin="round" />
    </svg>
  );
}

/** Serduszko na karcie oferty. */
export function FavButton({ base, id, label }: { base: string; id: string; label: string }) {
  const { has, toggle } = useFavorites(base);
  const active = has(id);
  return (
    <button
      type="button"
      className="wzc__fav"
      aria-pressed={active}
      aria-label={active ? `Usuń z ulubionych: ${label}` : `Dodaj do ulubionych: ${label}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
    >
      <HeartIcon filled={active} />
    </button>
  );
}
