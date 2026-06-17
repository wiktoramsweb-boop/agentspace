"use client";

import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { type ReactNode, useRef } from "react";

type GlowCardProps = {
  children: ReactNode;
  className?: string;
};

/**
 * GlowCard — karta z gradientem podążającym za kursorem.
 * Aceternity / Vercel "spotlight cards" inspired.
 */
export function GlowCard({ children, className }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  const maskImage = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, white, transparent)`;

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden ${className ?? ""}`}
    >
      {/* Hover gradient overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 60%)",
          WebkitMaskImage: maskImage,
          maskImage,
        }}
      />
      {/* Border highlight following cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle, rgba(52, 211, 153, 0.4), transparent 50%)",
          WebkitMaskImage: maskImage,
          maskImage,
          mixBlendMode: "overlay",
        }}
      />
      {children}
    </div>
  );
}
