"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Wersja kompaktowa — mniejsze paddingi, dla stron statycznych/prawnych. */
  compact?: boolean;
};

/**
 * Nagłówek podstrony marketingowej.
 * Jedna delikatna poświata zamiast aurory + spotlightu — spójne z landingiem.
 * Typografia dziedziczy z `.mk` (globals.css), więc h1 ma gradient i skalę.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  compact = false,
}: PageHeroProps) {
  return (
    <section
      className={`relative overflow-hidden px-6 ${
        compact
          ? "pt-[120px] pb-14 md:pt-[148px] md:pb-16"
          : "pt-[136px] pb-20 md:pt-[168px] md:pb-24"
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 opacity-[0.22]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 40%, rgba(47,109,246,0.35) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1080px]">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mk-eyebrow mb-6"
          >
            {eyebrow}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.06,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          className="max-w-[20ch]"
        >
          {title}
        </motion.h1>

        {description && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.14,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="mt-6 max-w-[56ch] text-lg leading-relaxed text-[var(--color-mk-muted)]"
          >
            {description}
          </motion.div>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-10"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
