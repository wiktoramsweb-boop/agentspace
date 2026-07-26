"use client";

import { usePathname } from "next/navigation";

// Delikatne wejście treści przy każdej zmianie podstrony.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-in-up">
      {children}
    </div>
  );
}
