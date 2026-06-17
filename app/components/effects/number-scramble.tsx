"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

type NumberScrambleProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
};

const SCRAMBLE_CHARS = "0123456789";

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

/**
 * NumberScramble — cyfry migoczą losowymi wartościami i progresywnie lokują się
 * od lewej do prawej na docelową wartość. Stripe / Linear signature.
 */
export function NumberScramble({
  value,
  prefix = "",
  suffix = "",
  duration = 1.4,
  className,
}: NumberScrambleProps) {
  const targetString = String(value);
  const targetLength = targetString.length;

  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(() => targetString.replace(/./g, "0"));

  useEffect(() => {
    if (!isInView) return;

    const totalMs = duration * 1000;
    // Częste odświeżanie losowych cyfr (30ms = ~33fps) — flicker feel.
    const scrambleIntervalMs = 35;
    // Co ile ms lockujemy kolejną pozycję od lewej.
    const lockIntervalMs = totalMs / (targetLength + 1);

    let lockedCount = 0;

    const scrambleId = setInterval(() => {
      let result = "";
      for (let i = 0; i < targetLength; i++) {
        result += i < lockedCount ? targetString[i] : randomChar();
      }
      setDisplay(result);
    }, scrambleIntervalMs);

    const lockId = setInterval(() => {
      lockedCount += 1;
      if (lockedCount >= targetLength) {
        clearInterval(lockId);
        clearInterval(scrambleId);
        setDisplay(targetString);
      }
    }, lockIntervalMs);

    return () => {
      clearInterval(scrambleId);
      clearInterval(lockId);
    };
  }, [isInView, targetString, targetLength, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <span className="tabular-nums">{display}</span>
      {suffix}
    </span>
  );
}
