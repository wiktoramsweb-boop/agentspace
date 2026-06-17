"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";

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
          className="fixed inset-x-0 top-4 z-50 mx-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 px-4 py-3 backdrop-blur-xl md:px-6"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-white">AgentSpace</span>
          </div>
          <a
            href="#waitlist"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            Dołącz do waitlist
          </a>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
