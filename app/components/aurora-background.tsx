"use client";

import { motion } from "motion/react";

export function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Główna aurora - emerald */}
      <motion.div
        className="absolute -top-1/2 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-emerald-500/[0.11] blur-3xl"
        animate={{
          x: ["-50%", "-30%", "-50%", "-70%", "-50%"],
          y: ["0%", "10%", "20%", "10%", "0%"],
          scale: [1, 1.1, 1.2, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Drugi blob - cyan, po przeciwnej stronie */}
      <motion.div
        className="absolute -top-1/4 right-0 h-[480px] w-[480px] rounded-full bg-cyan-500/[0.08] blur-3xl"
        animate={{
          x: ["0%", "-20%", "10%", "-10%", "0%"],
          y: ["10%", "30%", "20%", "0%", "10%"],
          scale: [1, 1.2, 1, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Trzeci blob - subtle violet */}
      <motion.div
        className="absolute top-1/4 left-0 h-[420px] w-[420px] rounded-full bg-violet-500/[0.06] blur-3xl"
        animate={{
          x: ["0%", "30%", "10%", "20%", "0%"],
          y: ["20%", "0%", "30%", "10%", "20%"],
          scale: [1, 0.9, 1.1, 1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Dolna maska - fade do czerni */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#08090b] via-[#08090b]/70 to-transparent" />
    </div>
  );
}
