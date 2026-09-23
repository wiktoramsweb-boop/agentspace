"use client";

import { useEffect, useState } from "react";

/**
 * Przełącznik jasnego i ciemnego motywu strony marketingowej.
 *
 * Pierwsza wizyta idzie za ustawieniem systemu odwiedzającego, a wybór
 * zapisujemy w przeglądarce. Skrypt w layoucie ustawia motyw jeszcze przed
 * pierwszym malowaniem, więc nie ma mignięcia bieli.
 */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const [light, setLight] = useState(false);

  // Domyślny motyw ustawia CSS z ustawień systemu, a zapamiętany wybór
  // dokładamy po starcie strony. Dzięki temu nie ma rozjazdu przy hydratacji.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("as_mk_theme");
    } catch {
      saved = null;
    }
    const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const theme = saved ?? system;
    if (saved) document.documentElement.dataset.mk = saved;
    setLight(theme === "light");
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.mk = next ? "light" : "dark";
    try {
      localStorage.setItem("as_mk_theme", next ? "light" : "dark");
    } catch {
      // tryb prywatny: motyw zadziała do przeładowania
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Włącz ciemny motyw" : "Włącz jasny motyw"}
      title={light ? "Ciemny motyw" : "Jasny motyw"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mk-hairline-strong)] text-[var(--color-mk-text)] transition-colors hover:bg-[var(--mk-surface-3)] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
        {light ? (
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.6v2.2M12 19.2v2.2M4.3 4.3l1.6 1.6M18.1 18.1l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.3 19.7l1.6-1.6M18.1 5.9l1.6-1.6" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  );
}
