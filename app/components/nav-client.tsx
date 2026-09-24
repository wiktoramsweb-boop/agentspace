"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ThemeSwitch } from "./mk/theme-switch";
import { LangSwitch } from "./mk/lang-switch";
import { localeHref, type Locale } from "@/lib/i18n/config";
import type { Dict } from "@/lib/i18n/pl";

/**
 * Górna nawigacja marketingu.
 *
 * UWAGA: żaden rodzic tego elementu nie może mieć `transform` -
 * transform tworzy nowy kontekst kompozycji i zabija backdrop-filter
 * (pasek przestaje być matowy, robi się płaski).
 *
 * Na telefonie linki są schowane pod przyciskiem menu. Wcześniej ich tam
 * po prostu nie było: strona pokazywała samo logo i przycisk kontaktu, więc
 * z telefonu nie dało się wejść ani w cennik, ani w produkt.
 */
export function NavClient({ lang, t }: { lang: Locale; t: Dict["nav"] }) {
  const NAV_LINKS = t.links;
  const href = (path: string) => localeHref(lang, path);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[68px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 border-b border-[var(--mk-hairline)] bg-[var(--mk-nav-bg)] backdrop-blur-xl"
      />

      <nav className="relative mx-auto flex h-full max-w-[1080px] items-center justify-between gap-4 px-6">
        <Link
          href={href("/")}
          className="flex items-center gap-2.5 text-[0.9375rem] font-semibold tracking-tight text-[var(--color-mk-text)] transition-opacity hover:opacity-80"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_1px_rgba(16,185,129,0.9)]" />
          </span>
          AgentSpace
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={href(link.href)}
              className="rounded-full px-3 py-2 text-sm font-medium text-[var(--color-mk-muted)] transition-colors hover:bg-[var(--mk-surface-2)] hover:text-[var(--color-mk-text)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitch />
          <LangSwitch lang={lang} />
          <Link
            href="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--color-mk-muted)] transition-colors hover:text-[var(--color-mk-text)] sm:block"
          >
            {t.login}
          </Link>
          <Link
            href={href("/kontakt")}
            className="hidden h-9 items-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 text-sm font-semibold text-[var(--mk-on-accent)] shadow-[0_6px_20px_-8px_rgba(16,185,129,0.9)] transition-all hover:shadow-[0_10px_28px_-8px_rgba(16,185,129,1)] hover:brightness-110 sm:inline-flex"
          >
            {t.cta}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.closeMenu : t.menu}
            aria-expanded={open}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--mk-hairline-strong)] text-[var(--color-mk-text)] transition-colors hover:bg-[var(--mk-surface-3)] md:hidden"
          >
            <span className="sr-only">{t.menu}</span>
            <span aria-hidden="true" className="relative block h-3.5 w-5">
              <span
                className={`absolute inset-x-0 top-0 h-[1.5px] bg-current transition-transform duration-300 ${
                  open ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute inset-x-0 top-[6.5px] h-[1.5px] bg-current transition-opacity duration-200 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute inset-x-0 bottom-0 h-[1.5px] bg-current transition-transform duration-300 ${
                  open ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-x-0 top-[68px] md:hidden"
          >
            <div className="border-b border-[var(--mk-hairline)] bg-[var(--mk-nav-panel)] px-6 pb-8 pt-4 backdrop-blur-xl">
              <div className="mx-auto max-w-[1080px]">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + i * 0.04, duration: 0.3 }}
                  >
                    <Link
                      href={href(link.href)}
                      className="block border-b border-[var(--mk-hairline)] py-4 text-lg text-[var(--color-mk-text)]"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href={href("/kontakt")}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 font-semibold text-[var(--mk-on-accent)]"
                  >
                    {t.cta}
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--mk-hairline-strong)] px-5 font-medium text-[var(--color-mk-text)]"
                  >
                    {t.loginLong}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
