"use client";

import { useState, useTransition } from "react";
import { dodajTermin, usunTermin } from "../actions";

const styl: React.CSSProperties = {
  border: "1px solid var(--linia)",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 15,
  background: "#fff",
  color: "var(--t)",
  width: "100%",
};

export function FormularzTerminu({ token }: { token: string }) {
  const [dzien, setDzien] = useState("");
  const [od, setOd] = useState("16:00");
  const [doGodz, setDoGodz] = useState("19:00");
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input type="date" value={dzien} onChange={(e) => setDzien(e.target.value)} style={styl} />
      <div style={{ display: "flex", gap: 10 }}>
        <input type="time" value={od} onChange={(e) => setOd(e.target.value)} style={styl} />
        <input type="time" value={doGodz} onChange={(e) => setDoGodz(e.target.value)} style={styl} />
      </div>
      {blad && <p style={{ color: "var(--czerwien)", fontSize: 14, margin: 0 }}>{blad}</p>}
      <button
        type="button"
        disabled={pending || !dzien}
        onClick={() => {
          setBlad(null);
          start(async () => {
            const w = await dodajTermin(token, dzien, od, doGodz);
            if (w.ok) setDzien("");
            else setBlad(w.error);
          });
        }}
        style={{
          ...styl,
          background: "var(--akcent)",
          color: "#fff",
          fontWeight: 600,
          border: "none",
          opacity: pending || !dzien ? 0.5 : 1,
        }}
      >
        {pending ? "Zapisuję..." : "Dodaj termin"}
      </button>
    </div>
  );
}

export function UsunTermin({ token, id }: { token: string; id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void usunTermin(token, id))}
      style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 18 }}
      aria-label="Usuń termin"
    >
      ×
    </button>
  );
}
