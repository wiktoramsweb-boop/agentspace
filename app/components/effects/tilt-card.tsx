import type { ReactNode } from "react";

/**
 * Dawniej karta przechylana kursorem w 3D. Przechył zdjęć i makiet nic nie
 * tłumaczy, a utrudnia czytanie, więc zostaje zwykły kontener.
 */
export function TiltCard({ children, className }: { children: ReactNode; className?: string; maxTilt?: number }) {
  return <div className={className}>{children}</div>;
}
