/**
 * Skąd przyszedł odwiedzający.
 *
 * Pierwszy lead z formularza przyszedł od właścicielki biura i nie dało się
 * ustalić, skąd nas znalazła: formularz zapisywał tylko treść wiadomości.
 * Dlatego zapamiętujemy źródło przy PIERWSZYM wejściu na stronę, a nie przy
 * wysłaniu formularza. Zanim ktoś dojdzie do kontaktu, zdąży przeklikać kilka
 * podstron i `document.referrer` pokazuje już tylko nasz własny adres.
 */

const KLUCZ = "as_zrodlo";

export type Zrodlo = {
  /** Strona, z której przyszedł: wyszukiwarka, portal, social. */
  referrer: string | null;
  /** Parametry kampanii, jeśli były w adresie. */
  utm: string | null;
  /** Pierwsza podstrona, na którą trafił. */
  wejscie: string | null;
  kiedy: string;
};

/** Wołane raz, przy wejściu na stronę. Nie nadpisuje tego, co już zapisane. */
export function zapamietajZrodlo(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(KLUCZ)) return;

    const params = new URLSearchParams(window.location.search);
    const utmy = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"]
      .map((k) => (params.get(k) ? `${k}=${params.get(k)}` : null))
      .filter(Boolean)
      .join("&");

    const ref = document.referrer || "";
    const obcy = ref && !ref.includes(window.location.hostname) ? ref : null;

    const z: Zrodlo = {
      referrer: obcy,
      utm: utmy || null,
      wejscie: window.location.pathname,
      kiedy: new Date().toISOString(),
    };
    sessionStorage.setItem(KLUCZ, JSON.stringify(z));
  } catch {
    /* prywatne okno albo zablokowane dane - trudno, po prostu nie wiemy */
  }
}

export function odczytajZrodlo(): Zrodlo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KLUCZ);
    return raw ? (JSON.parse(raw) as Zrodlo) : null;
  } catch {
    return null;
  }
}

/** Krótki, czytelny opis źródła do maila i do listy wiadomości. */
export function opiszZrodlo(z: Zrodlo | null): string {
  if (!z) return "nieznane";
  const czesci: string[] = [];
  if (z.utm) czesci.push(z.utm);
  if (z.referrer) {
    try {
      czesci.push(new URL(z.referrer).hostname.replace(/^www\./, ""));
    } catch {
      czesci.push(z.referrer);
    }
  }
  if (!czesci.length) czesci.push("wejście bezpośrednie");
  if (z.wejscie && z.wejscie !== "/") czesci.push(`wszedł na ${z.wejscie}`);
  return czesci.join(" · ");
}
