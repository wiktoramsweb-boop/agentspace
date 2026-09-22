"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Ulubione oferty odwiedzającego. Siedzą w przeglądarce, więc działają bez
 * logowania; w prawdziwej stronie biura ta sama lista trafia do CRM razem z
 * zapytaniem, dzięki czemu agent widzi, co klient oglądał przed telefonem.
 */
const EVENT = "wz-fav-change";

function key(wzor: string) {
  return `wz-fav-${wzor}`;
}

function read(wzor: string): string[] {
  try {
    const raw = localStorage.getItem(key(wzor));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites(wzor: string) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read(wzor));
    const sync = () => setIds(read(wzor));
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [wzor]);

  const toggle = useCallback(
    (id: string) => {
      const next = read(wzor).includes(id) ? read(wzor).filter((x) => x !== id) : [...read(wzor), id];
      try {
        localStorage.setItem(key(wzor), JSON.stringify(next));
      } catch {
        // tryb prywatny: ulubione działają do przeładowania strony
      }
      setIds(next);
      window.dispatchEvent(new Event(EVENT));
    },
    [wzor],
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
export function FavButton({ wzor, id, label }: { wzor: string; id: string; label: string }) {
  const { has, toggle } = useFavorites(wzor);
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
