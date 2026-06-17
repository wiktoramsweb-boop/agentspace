"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

type AnimatedStatProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
};

export function AnimatedStat({ value, suffix = "", prefix = "", duration = 1.4 }: AnimatedStatProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, value, {
      duration,
      ease: [0.21, 0.47, 0.32, 0.98],
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
