"use client";

import Link from "next/link";
import { useFavorites } from "./favorites";
import { OfferCard } from "./offer-card";
import { DEMO_OFFERS, plOffers } from "@/lib/wzory/data";

/** Lista ofert zapisanych przez odwiedzającego. Pusta lista też ma sens: podpowiadamy, co dalej. */
export function FavoritesList({ wzor }: { wzor: string }) {
  const { ids } = useFavorites(wzor);
  const rows = DEMO_OFFERS.filter((o) => ids.includes(o.id));

  if (rows.length === 0) {
    return (
      <div className="wzl__empty">
        <p className="wz-h3" style={{ marginBottom: 10 }}>
          Nie masz jeszcze zapisanych ofert
        </p>
        <p className="wz-muted" style={{ marginBottom: 20 }}>
          Klikaj serduszko przy ofertach, które Ci się podobają. Zostaną tutaj, nawet gdy zamkniesz przeglądarkę.
        </p>
        <Link href={`/wzory/${wzor}/oferty`} className="wz-btn">
          Przeglądaj oferty
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="wz-muted" style={{ marginBottom: 20 }}>
        {rows.length} {plOffers(rows.length)} na liście
      </p>
      <div className="wz-grid" data-revs>
        {rows.map((o) => (
          <OfferCard key={o.id} offer={o} wzor={wzor} />
        ))}
      </div>
      <div className="wz-box wz-box--accent" style={{ marginTop: 28 }}>
        <p className="wz-h3" style={{ marginBottom: 8 }}>
          Wyślij listę do agenta
        </p>
        <p className="wz-muted" style={{ marginBottom: 16 }}>
          Zamiast opisywać w mailu, które mieszkania Cię interesują, wyślij całą listę jednym kliknięciem. Agent
          przygotuje prezentacje w jednym dniu i podpowie, które z nich ma sens oglądać razem.
        </p>
        <Link href={`/wzory/${wzor}/kontakt`} className="wz-btn">
          Umów oglądanie
        </Link>
      </div>
    </>
  );
}
