"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

type TextRevealProps = {
  children: string;
  className?: string;
  delay?: number;
  staggerChildren?: number;
};

const container: Variants = {
  hidden: {},
  visible: (i: number = 0) => ({
    transition: {
      staggerChildren: 0.04,
      delayChildren: i,
    },
  }),
};

const child: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    filter: "blur(12px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

/**
 * Reveal tekstu litera po literze — z blur + slide up.
 * Premium hero entrance.
 */
export function TextReveal({ children, className, delay = 0 }: TextRevealProps) {
  const words = children.split(" ");

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
      custom={delay}
      style={{ display: "inline-block" }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {word.split("").map((char, charIndex) => (
            <motion.span
              key={charIndex}
              variants={child}
              style={{ display: "inline-block" }}
            >
              {char}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 && (
            <motion.span variants={child} style={{ display: "inline-block" }}>
              &nbsp;
            </motion.span>
          )}
        </span>
      ))}
    </motion.span>
  );
}

type WordRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Reveal całego bloku (word-level zamiast char-level) — szybsze dla długich tekstów.
 */
export function WordReveal({ children, className, delay = 0 }: WordRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      {children}
    </motion.div>
  );
}
