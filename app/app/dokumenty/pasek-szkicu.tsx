"use client";

import { useEffect, useRef, useState } from "react";
import { pobierzSzkic, usunSzkic, zapiszSzkic } from "./szkice-actions";

/**
 * Szkic w kreatorach z własnym ekranem (rezerwacja, aneks, protokół).
 * Otwarty z listy szkiców (?szkic=…) wczytuje dane do formularza, a po
 * pierwszym zapisie każda zmiana zapisuje się sama.
 */
export function PasekSzkicu<T extends object>({
  wzorId,
  tytul,
  dane,
  onWczytaj,
}: {
  wzorId: string;
  tytul: string;
  dane: T;
  onWczytaj: (dane: T) => void;
}) {
  const [id, setId] = useState<string | null>(null);
  const [kiedy, setKiedy] = useState<string | null>(null);
  const [stan, setStan] = useState<"" | "zapisuje" | "blad">("");
  const [blad, setBlad] = useState<string | null>(null);
  const pominZmiane = useRef(true);
  const aktualne = useRef(dane);
  aktualne.current = dane;

  useEffect(() => {
    let nr: string | null = null;
    try {
      nr = new URL(window.location.href).searchParams.get("szkic");
    } catch {}
    if (!nr) return;
    void pobierzSzkic(nr).then((r) => {
      if (!r.ok || r.szkic.wzorId !== wzorId) return;
      pominZmiane.current = true;
      onWczytaj({ ...aktualne.current, ...(r.szkic.dane as T) });
      setId(r.szkic.id);
      setKiedy(r.szkic.zmieniony);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wzorId]);

  async function zapisz(biezace: string | null = id) {
    setStan("zapisuje");
    setBlad(null);
    const r = await zapiszSzkic({ id: biezace, wzorId, tytul, dane: aktualne.current as Record<string, unknown> }).catch(() => null);
    if (!r || !r.ok) {
      setStan("blad");
      setBlad(r && !r.ok ? r.error : "Nie udało się zapisać szkicu.");
      return;
    }
    setStan("");
    setKiedy(r.kiedy);
    if (r.id !== id) {
      setId(r.id);
      try {
        const u = new URL(window.location.href);
        u.searchParams.set("szkic", r.id);
        window.history.replaceState(null, "", u.toString());
      } catch {}
    }
  }

  useEffect(() => {
    if (pominZmiane.current) {
      pominZmiane.current = false;
      return;
    }
    if (!id) return;
    const t = setTimeout(() => void zapisz(id), 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dane, id]);

  return (
    <div className="print-hide flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <span className="mr-auto min-w-0 text-slate-600">
        {id && kiedy && stan !== "blad"
          ? `Szkic zapisany ${new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(new Date(kiedy))}, zmiany zapisują się same.`
          : "Nie skończysz teraz? Zapisz szkic i wróć do niego z listy w Dokumentach."}
        {blad && <span className="block text-red-600">{blad}</span>}
      </span>
      <button
        type="button"
        onClick={() => void zapisz()}
        disabled={stan === "zapisuje"}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 transition hover:border-slate-400 disabled:opacity-60"
      >
        {stan === "zapisuje" ? "Zapisuję…" : id ? "Zapisz teraz" : "Zapisz jako szkic"}
      </button>
      {id && (
        <button
          type="button"
          onClick={async () => {
            if (!confirm("Usunąć ten szkic? Formularz na ekranie zostanie.")) return;
            const r = await usunSzkic(id);
            if (!r.ok) return setBlad(r.error);
            setId(null);
            setKiedy(null);
            try {
              const u = new URL(window.location.href);
              u.searchParams.delete("szkic");
              window.history.replaceState(null, "", u.toString());
            } catch {}
          }}
          className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          Usuń szkic
        </button>
      )}
    </div>
  );
}
