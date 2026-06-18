"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";
import { AuroraBackground } from "./aurora-background";
import { Spotlight } from "./effects/spotlight";

type PageHeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Wersja kompaktowa — mniejsze paddingi, lepsze dla compliance/static stron */
  compact?: boolean;
};

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  compact = false,
}: PageHeroProps) {
  return (
    <section
      className={`relative overflow-hidden border-b border-zinc-900 px-6 ${
        compact ? "pt-32 pb-16 md:pt-36 md:pb-20" : "pt-32 pb-20 md:pt-40 md:pb-28"
      }`}
    >
      <AuroraBackground />
      <Spotlight />

      <div className="relative z-10 mx-auto max-w-4xl">
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400"
          >
            {eyebrow}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.8,
            delay: 0.1,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          className={`mb-6 font-semibold leading-[1.1] tracking-tight text-white ${
            compact ? "text-3xl md:text-4xl lg:text-5xl" : "text-4xl md:text-5xl lg:text-6xl"
          }`}
        >
          {title}
        </motion.h1>

        {description && (
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.7,
              delay: 0.25,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl"
          >
            {description}
          </motion.div>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
