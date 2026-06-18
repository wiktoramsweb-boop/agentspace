"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * Pasek postępu czytania artykułu — pokazuje jak daleko jest user w artykule.
 * Renderuj pod nav, nad treścią.
 */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400"
      style={{ scaleX }}
    />
  );
}
