"use client";

import { useState, useTransition } from "react";
import { oznaczOferte } from "./actions";

/** Dwa przyciski pod ofertą: podoba się albo nie. */
export function ReakcjaOferty({
  token,
  propertyId,
  reakcja,
}: {
  token: string;
  propertyId: string;
  reakcja: "lubi" | "nie_lubi" | null;
}) {
  const [wybrane, setWybrane] = useState(reakcja);
  const [pending, start] = useTransition();

  function kliknij(nowa: "lubi" | "nie_lubi") {
    // Ustawiamy od razu, żeby przycisk reagował natychmiast; zapis idzie w tle.
    setWybrane(nowa);
    start(() => void oznaczOferte(token, propertyId, nowa));
  }

  return (
    <div className="portal-reakcje">
      <button
        type="button"
        className="portal-reakcja"
        data-wybrane={wybrane === "lubi" ? "lubi" : undefined}
        disabled={pending}
        onClick={() => kliknij("lubi")}
      >
        Podoba mi się
      </button>
      <button
        type="button"
        className="portal-reakcja"
        data-wybrane={wybrane === "nie_lubi" ? "nie_lubi" : undefined}
        disabled={pending}
        onClick={() => kliknij("nie_lubi")}
      >
        Nie dla mnie
      </button>
    </div>
  );
}
