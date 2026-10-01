"use client";

import { useEffect } from "react";

/**
 * Błąd poza aplikacją: logowanie, zaproszenie, strony biur.
 * Celowo bez nawigacji marketingu, bo ta strona obsługuje też strony klientów.
 */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 12px" }}>Nie udało się wczytać strony</h1>
        <p style={{ color: "#52525b", lineHeight: 1.6, margin: "0 0 20px" }}>
          To zwykle chwilowy problem z połączeniem. Spróbuj ponownie za moment.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ background: "#059669", color: "#fff", border: 0, borderRadius: 12, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
        >
          Spróbuj ponownie
        </button>
        {error.digest && <p style={{ marginTop: 20, fontFamily: "monospace", fontSize: 12, color: "#a1a1aa" }}>Kod błędu: {error.digest}</p>}
      </div>
    </div>
  );
}
