// Publiczna wersja demo: każdy odwiedzający loguje się na to samo konto gościa
// w biurze demo. Gość ogląda wszystko, ale zmieniać może tylko to, co jest
// bezpieczne i pokazuje produkt (trening AI Coach, asystent AI).
// Bez importów, bo plik czyta i middleware, i przeglądarka, i test.

/** Celowo NIE w domenie @demo.agentspace.pl: zasiew demo kasuje stamtąd konta spoza składu. */
export const DEMO_EMAIL = "gosc-demo@agentspace.pl";
export const DEMO_IMIE = "Gość demo";

/** Ścieżki, pod którymi gość może wysyłać zmiany (POST). Reszta jest zablokowana. */
const DOZWOLONE = ["/app/trening/", "/app/sesja/", "/api/coach/", "/api/assistant/", "/wejdz-demo"];

export function demoMozeZapisac(sciezka: string): boolean {
  // Wpis z ukośnikiem na końcu obejmuje podstrony, bez ukośnika tylko dokładny adres.
  // Zadania treningowe dla zespołu to już zarządzanie biurem, nie sam trening.
  if (sciezka.startsWith("/app/trening/zadania")) return false;
  return DOZWOLONE.some((p) => (p.endsWith("/") ? sciezka.startsWith(p) : sciezka === p));
}

export const KOMUNIKAT_DEMO = "W wersji demo zapisywanie jest wyłączone. Załóż darmowe konto, żeby pracować na własnych danych.";

function base64url(s: string): string {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(b + "=".repeat((4 - (b.length % 4)) % 4));
}

/**
 * E-mail z ciasteczka sesji Supabase, bez zapytania do sieci.
 * Podpisu NIE sprawdzamy: wynik służy wyłącznie do blokowania. Kto podrobi
 * ciasteczko z adresem gościa, zablokuje sam siebie, a podrobione ciasteczko
 * z innym adresem i tak odrzuci Supabase przy prawdziwym zapytaniu.
 */
export function emailZCiasteczek(ciasteczka: { name: string; value: string }[]): string | null {
  const czesci = ciasteczka
    .filter((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => Number(a.name.split(".").pop()) - Number(b.name.split(".").pop()));
  if (!czesci.length) return null;
  try {
    let surowe = czesci.map((c) => c.value).join("");
    surowe = decodeURIComponent(surowe);
    const json = surowe.startsWith("base64-") ? base64url(surowe.slice(7)) : surowe;
    const sesja = JSON.parse(json);
    const token: string | undefined = Array.isArray(sesja) ? sesja[0] : sesja?.access_token;
    if (!token) return null;
    const dane = JSON.parse(base64url(token.split(".")[1] ?? ""));
    return typeof dane.email === "string" ? dane.email.toLowerCase() : null;
  } catch {
    return null;
  }
}
