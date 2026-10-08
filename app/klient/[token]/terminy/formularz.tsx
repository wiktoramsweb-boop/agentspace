"use client";

import { useState, useTransition } from "react";
import { dodajTermin, usunTermin } from "../actions";

/** Gotowe przedziały: większość ludzi i tak wybiera popołudnie albo weekend. */
const SZYBKIE: { label: string; od: string; do: string }[] = [
  { label: "Rano 9-12", od: "09:00", do: "12:00" },
  { label: "Po południu 16-19", od: "16:00", do: "19:00" },
  { label: "Cały dzień", od: "09:00", do: "20:00" },
];

export function FormularzTerminu({ token }: { token: string }) {
  const [dzien, setDzien] = useState("");
  const [od, setOd] = useState("16:00");
  const [doGodz, setDoGodz] = useState("19:00");
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input
        type="date"
        className="portal-pole"
        value={dzien}
        onChange={(e) => setDzien(e.target.value)}
        aria-label="Dzień"
      />

      <div className="portal-filtry" style={{ margin: 0 }}>
        {SZYBKIE.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              setOd(s.od);
              setDoGodz(s.do);
            }}
            aria-pressed={od === s.od && doGodz === s.do}
            className="portal-chip"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <input type="time" className="portal-pole" value={od} onChange={(e) => setOd(e.target.value)} aria-label="Od godziny" />
        <input type="time" className="portal-pole" value={doGodz} onChange={(e) => setDoGodz(e.target.value)} aria-label="Do godziny" />
      </div>

      {blad && <p style={{ color: "var(--czerwien)", fontSize: 14, margin: 0 }}>{blad}</p>}

      <button
        type="button"
        className="portal-przycisk"
        disabled={pending || !dzien}
        onClick={() => {
          setBlad(null);
          start(async () => {
            const w = await dodajTermin(token, dzien, od, doGodz);
            if (w.ok) setDzien("");
            else setBlad(w.error);
          });
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
      style={{ background: "none", border: "none", color: "var(--t3)", cursor: "pointer", fontSize: 20, padding: "0 4px" }}
      aria-label="Usuń termin"
    >
      ×
    </button>
  );
}
