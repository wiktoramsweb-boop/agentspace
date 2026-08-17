"use client";

import { useFormStatus } from "react-dom";

/**
 * Przycisk „submit" ze stanem ładowania - sam czyta pending z rodzica <form>.
 * Dzięki temu użytkownik od razu widzi, że klik zadziałał (spinner + blokada),
 * a opcjonalny overlay przykrywa dłuższe akcje (np. start sesji z przekierowaniem).
 */
export function SubmitButton({
  children,
  pendingText,
  className,
  overlay = false,
  overlayText = "Chwila…",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  overlay?: boolean;
  overlayText?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        type="submit"
        disabled={pending || disabled}
        aria-busy={pending}
        className={`inline-flex items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
      >
        {pending && <Spinner />}
        {pending ? (pendingText ?? children) : children}
      </button>

      {overlay && pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
            <p className="font-medium text-white">{overlayText}</p>
            <p className="mt-1 text-sm text-zinc-500">Chwilę to potrwa…</p>
          </div>
        </div>
      )}
    </>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />;
}
