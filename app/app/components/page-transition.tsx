"use client";

import { usePathname } from "next/navigation";

// Delikatne wejście treści przy każdej zmianie podstrony.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // UWAGA: tylko opacity (animate-page-in). Nie używać animacji z transform tutaj -
  // transform na tym kontenerze psuje pozycjonowanie okien modalnych (position:fixed).
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
}
