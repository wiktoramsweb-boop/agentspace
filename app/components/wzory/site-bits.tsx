"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { trackView } from "@/app/strona/track";

/**
 * Licznik odsłon. Jedna odsłona na sesję przeglądarki i podstronę, żeby
 * odświeżanie strony nie napompowało statystyk.
 */
export function ViewPing({ agencyId }: { agencyId: string }) {
  const path = usePathname();
  const kind = path.includes("/oferta/") ? "oferta" : path.includes("/poradnik") ? "poradnik" : "strona";

  useEffect(() => {
    const key = `wz-seen-${path}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // tryb prywatny: policzymy odsłonę, trudno
    }
    const ref = document.referrer && !document.referrer.includes(location.host) ? document.referrer : undefined;
    void trackView(agencyId, path, kind, ref);
  }, [agencyId, path, kind]);

  return null;
}

/**
 * Pasek zgody na cookies. Strona biura nie ustawia żadnych ciasteczek
 * śledzących, więc pytamy tylko o te dodatkowe i domyślnie nic nie włączamy.
 */
export function CookieBar({ office }: { office: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("wz-cookies")) setShow(true);
    } catch {
      // brak dostępu do pamięci: nie zawracamy głowy banerem
    }
  }, []);

  function decide(value: "niezbedne" | "wszystkie") {
    try {
      localStorage.setItem("wz-cookies", value);
    } catch {
      // ignorujemy
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <aside className="wz-cookies" role="dialog" aria-label="Zgoda na pliki cookies">
      <p>
        Używamy tylko tego, co niezbędne, żeby strona działała, oraz anonimowego licznika odsłon. Nie śledzimy Cię po
        internecie i nie sprzedajemy danych. {office} przetwarza dane z formularzy wyłącznie po to, żeby odpowiedzieć na
        zapytanie.
      </p>
      <div className="wz-cookies__row">
        <button type="button" className="wz-btn wz-btn--sm wz-btn--ghost" onClick={() => decide("niezbedne")}>
          Tylko niezbędne
        </button>
        <button type="button" className="wz-btn wz-btn--sm" onClick={() => decide("wszystkie")}>
          Rozumiem
        </button>
      </div>
    </aside>
  );
}
