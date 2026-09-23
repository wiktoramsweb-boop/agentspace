"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

/**
 * Ruchome drobiazgi strony marketingowej.
 *
 * Wszystko liczy się na CSS i transformacjach, bez dodatkowych bibliotek, i
 * każdy element ma wariant dla osób z włączonym ograniczeniem animacji.
 */

const ease = [0.22, 0.61, 0.36, 1] as const;

/** Liczba, która dolicza się od zera, gdy wjedzie w kadr. */
export function Ticker({
  value,
  suffix = "",
  decimals = 0,
  duration = 1400,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {new Intl.NumberFormat("pl-PL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(shown)}
      {suffix}
    </span>
  );
}

/** Zdanie odsłaniane słowo po słowie w rytmie przewijania. */
export function RevealWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");

  if (reduce) return <p className={className}>{text}</p>;

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={`${w}-${i}`} progress={scrollYProgress} range={[i / words.length, (i + 1.6) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {children}
      <span>&nbsp;</span>
    </motion.span>
  );
}

/** Karta z poświatą podążającą za kursorem. */
export function SpotlightCard({
  children,
  className = "",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduce = useReducedMotion();

  const content = (
    <div
      onMouseMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      className={`mk-spot group/spot relative h-full overflow-hidden rounded-[20px] border border-[var(--mk-hairline)] bg-[var(--mk-card-bg)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--color-mk-accent)_36%,transparent)] ${className}`}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background: useTransform(
            [x, y],
            ([mx, my]) =>
              `radial-gradient(240px circle at ${mx}px ${my}px, color-mix(in srgb, var(--color-mk-accent) 16%, transparent), transparent 70%)`,
          ),
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );

  return href ? (
    <a href={href} className="block h-full">
      {content}
    </a>
  ) : (
    content
  );
}

/**
 * Kroki procesu z przyklejonym zdjęciem: tekst po lewej przewija się,
 * a obraz po prawej zmienia się razem z aktywnym krokiem.
 */
export function StickySteps({
  steps,
}: {
  steps: { n: string; title: string; body: string; photo: string }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
      <ol className="relative">
        {steps.map((s, i) => (
          <StepItem key={s.n} index={i} onActive={setActive} active={active === i}>
            <span className="mb-3 flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300 ${
                  active === i
                    ? "border-transparent bg-[var(--color-mk-accent)] text-[var(--mk-on-accent)]"
                    : "border-[var(--mk-hairline-strong)] text-[var(--color-mk-muted)]"
                }`}
              >
                {s.n}
              </span>
              <span className="text-xl text-[var(--color-mk-text)] md:text-2xl">{s.title}</span>
            </span>
            <p className="max-w-[52ch] pl-11 text-[0.9375rem] leading-relaxed text-[var(--color-mk-muted)]">{s.body}</p>
          </StepItem>
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-28 overflow-hidden rounded-[24px] border border-[var(--mk-hairline)]">
          <div className="relative aspect-[4/5]">
            {steps.map((s, i) => (
              <motion.div
                key={s.photo}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: active === i ? 1 : 0, scale: active === i ? 1 : 1.04 }}
                transition={{ duration: 0.7, ease }}
              >
                <Image src={s.photo} alt="" fill sizes="45vw" className="object-cover" />
              </motion.div>
            ))}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--mk-scrim)] via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 right-6 text-lg text-white">{steps[active].title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({
  children,
  index,
  active,
  onActive,
}: {
  children: React.ReactNode;
  index: number;
  active: boolean;
  onActive: (i: number) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { amount: 0.7, margin: "-20% 0px -35% 0px" });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <li
      ref={ref}
      className={`border-l py-8 pl-6 transition-colors duration-500 ${
        active ? "border-[var(--color-mk-accent)]" : "border-[var(--mk-hairline)]"
      }`}
    >
      <div className={`transition-opacity duration-500 ${active ? "opacity-100" : "opacity-55"}`}>{children}</div>
    </li>
  );
}

/** Delikatne smugi w tle sekcji, zamiast płaskiego koloru. */
export function Beams({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute left-[-20%] h-px w-[140%] origin-left"
          style={{
            top: `${18 + i * 26}%`,
            background:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-mk-accent) 45%, transparent), color-mix(in srgb, var(--color-mk-accent-2) 35%, transparent), transparent)",
            rotate: `${-8 + i * 6}deg`,
          }}
          initial={{ opacity: 0, scaleX: 0.3 }}
          whileInView={{ opacity: [0, 0.7, 0.25], scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.4 + i * 0.5, delay: i * 0.25, ease }}
        />
      ))}
    </div>
  );
}

/** Zdjęcie, które lekko przechyla się za kursorem. */
export function TiltPhoto({
  src,
  alt,
  caption,
  className = "",
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 140, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 140, damping: 18 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        if (reduce || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        ry.set(px * 9);
        rx.set(-py * 9);
      }}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={`relative overflow-hidden rounded-[22px] border border-[var(--mk-hairline)] ${className}`}
    >
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
      {caption && (
        <>
          <span className="absolute inset-0 bg-gradient-to-t from-[var(--mk-scrim)] via-transparent to-transparent" />
          <span className="absolute bottom-5 left-5 right-5 text-sm text-white/90">{caption}</span>
        </>
      )}
    </motion.div>
  );
}
