"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Elementy wizualne strony marketingowej: ramka z podglądem aplikacji,
 * zdjęcia z lekką paralaksą i przewijany pasek.
 *
 * Powstały, bo strona składała się z samych ciemnych kart z tekstem i nie
 * pokazywała ani produktu, ani ludzi, dla których jest robiony.
 */

const ease = [0.22, 0.61, 0.36, 1] as const;

/** Okno przeglądarki z podglądem aplikacji. */
export function BrowserShot({
  children,
  label = "agentspace.pl/app",
  className = "",
  tilt = false,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
  tilt?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 26, rotateX: tilt ? 8 : 0 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease }}
      className={`overflow-hidden rounded-2xl border border-[var(--mk-hairline-strong)] bg-slate-100 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.75)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <span className="flex gap-1.5">
          {["#f87171", "#fbbf24", "#34d399"].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          ))}
        </span>
        <span className="mx-auto rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-500">{label}</span>
      </div>
      <div className="aspect-[4/3] w-full sm:aspect-[16/11]">{children}</div>
    </motion.div>
  );
}

/** Zdjęcie z podpisem i delikatnym ruchem przy przewijaniu. */
export function PhotoTile({
  src,
  alt,
  title,
  body,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  title: string;
  body: string;
  className?: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-6%", "6%"]);

  return (
    <div ref={ref} className={`group relative overflow-hidden rounded-[20px] border border-[var(--mk-hairline-strong)] ${className}`}>
      <motion.div style={{ y }} className="absolute inset-[-8%]">
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" priority={priority} className="object-cover" />
      </motion.div>
      {/* Napisy leżą na zdjęciu, więc przyciemnienie musi być mocne niezależnie
          od motywu strony, inaczej biały tytuł ginie w jasnym wariancie. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,7,10,0.94)] via-[rgba(4,7,10,0.55)] to-[rgba(4,7,10,0.08)]" />
      <div className="relative flex h-full flex-col justify-end p-7">
        <h4 className="mb-2 text-xl !text-white [-webkit-text-fill-color:#fff] [text-shadow:0_2px_14px_rgba(0,0,0,0.5)]">{title}</h4>
        <p className="max-w-[34ch] text-[0.9375rem] leading-relaxed text-white/80">{body}</p>
      </div>
    </div>
  );
}

/** Przewijany pasek z hasłami albo nazwami modułów. */
export function MkMarquee({ items }: { items: string[] }) {
  return (
    <div className="mk-marquee">
      {[0, 1].map((k) => (
        <div key={k} className="mk-marquee__track" aria-hidden={k === 1}>
          {items.map((t) => (
            <span key={`${k}-${t}`} className="mk-marquee__item">
              {t}
              <i aria-hidden="true">✦</i>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Przełącznik podglądów: trzy ekrany aplikacji bez opuszczania sekcji. */
export function ShotTabs({
  tabs,
}: {
  // Gotowe elementy, a nie funkcje: serwer nie może przekazać funkcji do
  // komponentu klienckiego, a i tak renderujemy wszystkie trzy podglądy.
  tabs: { key: string; label: string; note: string; node: React.ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`relative rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active === t.key ? "text-emerald-950" : "text-[var(--color-mk-muted)] hover:text-[var(--color-mk-text)]"
            }`}
          >
            {active === t.key && (
              <motion.span
                layoutId="shot-tab"
                className="absolute inset-0 rounded-xl bg-[var(--color-mk-accent)]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <motion.div key={current.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
          <BrowserShot label={`agentspace.pl/app/${current.key}`}>{current.node}</BrowserShot>
        </motion.div>
        <p className="text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{current.note}</p>
      </div>
    </div>
  );
}

/** Kafel wzoru strony www: zdjęcie, nazwa i dla kogo. */
export function TemplateTile({
  href,
  photo,
  name,
  forWhom,
  swatch,
}: {
  href: string;
  photo: string;
  name: string;
  forWhom: string;
  swatch: string[];
}) {
  return (
    <Link href={href} className="group block overflow-hidden rounded-[20px] border border-[var(--mk-hairline-strong)] bg-[var(--mk-surface-2)]">
      <span className="relative block aspect-[16/10] overflow-hidden">
        <Image
          src={photo}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition duration-700 group-hover:scale-[1.05]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[rgba(4,7,10,0.92)] via-[rgba(4,7,10,0.2)] to-transparent" />
      </span>
      <span className="flex items-center justify-between gap-3 p-5">
        <span>
          <span className="block font-medium text-[var(--color-mk-text)]">{name}</span>
          <span className="block text-sm text-[var(--color-mk-muted)]">{forWhom}</span>
        </span>
        <span className="flex flex-shrink-0 gap-1">
          {swatch.map((c) => (
            <span key={c} className="h-4 w-4 rounded-full border border-[var(--mk-hairline-strong)]" style={{ background: c }} />
          ))}
        </span>
      </span>
    </Link>
  );
}
