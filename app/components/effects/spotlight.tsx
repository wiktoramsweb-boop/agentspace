"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * Spotlight — świetlna plama która śledzi kursor.
 * Działa relative w kontenerze rodzica. Premium hero effect (Linear/Vercel style).
 */
export function Spotlight() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const background = useTransform(
    [x, y],
    ([latestX, latestY]: number[]) =>
      `radial-gradient(600px circle at ${latestX}px ${latestY}px, rgba(16, 185, 129, 0.15), transparent 60%)`,
  );

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(event.clientX - rect.left);
      mouseY.set(event.clientY - rect.top);
    }

    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    parent.addEventListener("mousemove", handleMouseMove);
    return () => parent.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0"
      style={{ background }}
    />
  );
}
