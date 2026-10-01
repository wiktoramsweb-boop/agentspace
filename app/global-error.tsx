"use client";

/**
 * Ostatnia linia obrony: błąd w samym głównym layoucie. Musi mieć własne
 * <html> i <body>, bo layout się nie wyrenderował.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pl">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, margin: "0 0 12px" }}>AgentSpace chwilowo nie działa</h1>
          <p style={{ color: "#52525b", lineHeight: 1.6, margin: "0 0 20px" }}>
            Pracujemy nad tym. Spróbuj ponownie za moment.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ background: "#059669", color: "#fff", border: 0, borderRadius: 12, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}
          >
            Spróbuj ponownie
          </button>
          {error.digest && <p style={{ marginTop: 20, fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>Kod błędu: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
