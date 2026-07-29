"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Okno modalne z przyklejonym nagłówkiem (zawsze widoczny ✕) i przewijaną
 * treścią. Zamyka się przez ✕, klawisz Esc lub kliknięcie w tło.
 *
 * Mobile: wysokość liczona w dvh (zmniejsza się, gdy wyskakuje klawiatura), a
 * kliknięte pole samo przewija się do widoku nad klawiaturą.
 *
 * Wewnątrz umieść <form className="flex min-h-0 flex-1 flex-col"> z przewijaną
 * częścią (flex-1 overflow-y-auto) i przyklejoną stopką — patrz przykłady.
 */
export function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  // Gdy użytkownik kliknie pole (telefon) — przewiń je do widoku nad klawiaturą.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    function onFocusIn(e: FocusEvent) {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
        // Odczekaj, aż klawiatura się wysunie, potem wyśrodkuj pole.
        setTimeout(() => t.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
      }
    }
    el.addEventListener("focusin", onFocusIn);
    return () => el.removeEventListener("focusin", onFocusIn);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[90dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
