"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { localeHref, type Locale } from "@/lib/i18n/config";

export type ModulKafelek = {
  slug: string;
  name: string;
  lead: string;
  ilustracja?: string;
  photo: string;
  /** Liczba możliwości - pokazujemy ją jako dowód, że moduł nie jest pusty. */
  ile: number;
};

export type KategoriaKafelek = {
  id: string;
  label: string;
  opis: string;
  moduly: ModulKafelek[];
};

/**
 * Przeglądarka modułów na stronie głównej.
 *
 * Wcześniej szesnaście modułów leżało jeden pod drugim jako wysokie kafelki
 * ze zdjęciami i strona główna ciągnęła się bez końca. Tutaj wysokość sekcji
 * nie zależy od liczby modułów: widać cztery grupy, a w grupie listę nazw
 * z podglądem wybranej pozycji obok.
 *
 * Wybór trzymamy jako „kategoria + slug”, a nie sam indeks, bo przy zmianie
 * zakładki indeks wskazywałby moduł z poprzedniej grupy.
 */
export function ModulesExplorer({
  kategorie,
  lang,
  t,
}: {
  kategorie: KategoriaKafelek[];
  lang: Locale;
  t: { seeModule: string; all: string; capabilities: string };
}) {
  const [aktywnaId, setAktywnaId] = useState(kategorie[0]?.id ?? "");
  const kategoria = kategorie.find((k) => k.id === aktywnaId) ?? kategorie[0];
  const [wybranySlug, setWybranySlug] = useState(kategoria?.moduly[0]?.slug ?? "");
  const reduce = useReducedMotion();

  const wybrany =
    kategoria?.moduly.find((m) => m.slug === wybranySlug) ?? kategoria?.moduly[0];
  const href = (path: string) => localeHref(lang, path);
  // Strona www ma własną galerię wzorów, więc kieruje tam, nie na opis modułu.
  const adres = (slug: string) => href(slug === "strona-www" ? "/wzory" : `/produkt/${slug}`);

  function zmienKategorie(id: string) {
    setAktywnaId(id);
    const pierwsza = kategorie.find((k) => k.id === id)?.moduly[0]?.slug;
    if (pierwsza) setWybranySlug(pierwsza);
  }

  if (!kategoria || !wybrany) return null;

  return (
    <div className="mt-12">
      {/* Zakładki */}
      <div className="-mx-6 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex w-max gap-1 rounded-full border border-[var(--mk-hairline)] bg-[var(--mk-surface-2)] p-1">
          {kategorie.map((k) => {
            const aktywna = k.id === kategoria.id;
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => zmienKategorie(k.id)}
                aria-pressed={aktywna}
                className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  aktywna
                    ? "text-[var(--mk-on-accent)]"
                    : "text-[var(--color-mk-muted)] hover:text-[var(--color-mk-text)]"
                }`}
              >
                {aktywna && (
                  <motion.span
                    layoutId="mk-tab"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                  />
                )}
                <span className="relative">{k.label}</span>
                <span className="relative ml-2 text-xs opacity-60 tabular-nums">{k.moduly.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-[var(--color-mk-muted)]">{kategoria.opis}</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Lista modułów w grupie */}
        <div className="self-start rounded-[20px] border border-[var(--mk-hairline)] bg-[var(--mk-surface-2)] p-2">
          {kategoria.moduly.map((m, i) => {
            const aktywny = m.slug === wybrany.slug;
            return (
              <button
                key={m.slug}
                type="button"
                onMouseEnter={() => setWybranySlug(m.slug)}
                onFocus={() => setWybranySlug(m.slug)}
                onClick={() => setWybranySlug(m.slug)}
                className={`group relative flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition-colors ${
                  aktywny ? "bg-[var(--mk-surface-3)]" : "hover:bg-[var(--mk-surface-3)]"
                }`}
              >
                {aktywny && (
                  <motion.span
                    layoutId="mk-modul"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                    className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-emerald-400 to-cyan-400"
                  />
                )}
                <span className="w-6 shrink-0 font-mono text-[11px] tabular-nums text-[var(--color-mk-muted)] opacity-70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[0.9375rem] font-medium transition-colors ${
                      aktywny ? "text-[var(--color-mk-text)]" : "text-[var(--color-mk-text)] opacity-80"
                    }`}
                  >
                    {m.name}
                  </span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-snug text-[var(--color-mk-muted)] lg:hidden">
                    {m.lead}
                  </span>
                </span>
                <svg
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 text-[var(--color-mk-accent)] transition-all ${
                    aktywny ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                  }`}
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path d="M3 10h13m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            );
          })}

          <Link
            href={href("/produkt")}
            className="mt-1 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-[var(--mk-accent-text)] transition-colors hover:bg-[var(--mk-surface-3)]"
          >
            {t.all}
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
              <path d="M3 10h13m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Podgląd wybranego modułu */}
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--mk-hairline)] bg-[var(--mk-surface-2)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={wybrany.slug}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
              className="flex h-full flex-col"
            >
              <div className="bg-ilustracja relative aspect-[16/10] w-full border-b border-[var(--mk-hairline)]">
                <Image
                  src={wybrany.ilustracja ?? wybrany.photo}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className={wybrany.ilustracja ? "object-contain p-6" : "object-cover"}
                />
              </div>
              <div className="flex flex-1 flex-col p-7">
                <h4 className="mb-2">{wybrany.name}</h4>
                <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-text)] opacity-85">
                  {wybrany.lead}
                </p>
                <div className="mt-auto flex items-center justify-between pt-6">
                  <span className="font-mono text-xs tabular-nums text-[var(--color-mk-muted)]">
                    {wybrany.ile} {t.capabilities}
                  </span>
                  <Link
                    href={adres(wybrany.slug)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--mk-accent-text)] hover:underline"
                  >
                    {t.seeModule}
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                      <path d="M3 10h13m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
