"use client";

import { useState, useTransition } from "react";
import { decyzjaOCenie } from "./actions";
import { formatMoney } from "@/lib/invoice";
import { opisPropozycjiCeny } from "@/lib/portal-klienta";

/**
 * Zgoda właściciela na zmianę ceny ofertowej.
 *
 * Cena w ogłoszeniu zmienia się dopiero po kliknięciu „Zgadzam się" - biuro
 * może ją wyłącznie zaproponować. Dlatego przycisk pyta jeszcze raz: to jest
 * decyzja o kilkudziesięciu tysiącach, a nie polubienie zdjęcia.
 */
export function DecyzjaOCenie({
  token,
  id,
  obecna,
  proponowana,
  uzasadnienie,
}: {
  token: string;
  id: string;
  obecna: number | null;
  proponowana: number;
  uzasadnienie: string | null;
}) {
  const [blad, setBlad] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const opis = opisPropozycjiCeny(obecna, proponowana);

  function zdecyduj(zgoda: boolean) {
    const pytanie = zgoda
      ? `Zgadzasz się na cenę ${formatMoney(proponowana)} zł? Oferta zostanie od razu zmieniona.`
      : "Nie zgadzasz się na tę zmianę? Cena zostanie bez zmian.";
    if (!confirm(pytanie)) return;
    setBlad(null);
    start(async () => {
      const w = await decyzjaOCenie(token, id, zgoda);
      if (!w.ok) setBlad(w.error);
    });
  }

  return (
    <div className="portal-propozycja">
      <h4>Biuro proponuje {opis.kierunek === "obnizka" ? "obniżkę" : "podwyżkę"} ceny</h4>
      <div className="kwoty">
        {obecna != null && <span className="stara">{formatMoney(obecna)} zł</span>}
        <span className="nowa">{formatMoney(proponowana)} zł</span>
      </div>
      {obecna != null && (
        <p>
          {opis.kierunek === "obnizka" ? "Mniej o" : "Więcej o"} {formatMoney(opis.roznica)} zł
          {opis.procent != null && ` (${String(opis.procent).replace(".", ",")}%)`}.
        </p>
      )}
      {uzasadnienie && <p>{uzasadnienie}</p>}
      <p>Bez Twojej zgody cena w ofercie zostaje bez zmian.</p>

      <div className="portal-decyzja">
        <button type="button" className="tak" disabled={pending} onClick={() => zdecyduj(true)}>
          Zgadzam się
        </button>
        <button type="button" disabled={pending} onClick={() => zdecyduj(false)}>
          Nie teraz
        </button>
      </div>
      {blad && <p style={{ color: "var(--czerwien)", fontSize: 14 }}>{blad}</p>}
    </div>
  );
}
