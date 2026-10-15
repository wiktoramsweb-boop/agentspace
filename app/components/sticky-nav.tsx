"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { Logo } from "./marka";

export function StickyNav() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 600);
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-2xl border border-[var(--mk-hairline)] bg-[var(--color-mk-bg)]/70 px-4 py-3 backdrop-blur-xl md:px-6"
        >
          <div className="flex items-center text-[var(--color-mk-text)]">
            <Logo rozmiar={24} ton="dziedzicz" />
          </div>
          <a
            href="#waitlist"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[var(--mk-on-accent)] transition hover:bg-emerald-400"
          >
            Dołącz do waitlist
          </a>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
