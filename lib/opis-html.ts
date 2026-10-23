// Opis oferty z formatowaniem. Bez importów: czyta to przeglądarka (edytor),
// serwer (zapis, eksport) i test (`npm run test:opis`).
//
// Zapisujemy wąski podzbiór HTML: akapity, pogrubienie, kursywa, podkreślenie
// i listy. Wszystko inne wycinamy przy zapisie, więc opis nie przemyci skryptu
// na stronę biura ani do portalu. Stare opisy to zwykły tekst i zostają nim,
// dopóki ktoś ich nie otworzy w edytorze.

const DOZWOLONE = new Set(["p", "br", "strong", "em", "u", "ul", "ol", "li"]);
const ZAMIANY: Record<string, string> = { b: "strong", i: "em", div: "p", h1: "p", h2: "p", h3: "p", h4: "p" };

export function czyHtml(s: string | null | undefined): boolean {
  return /<\/?(p|br|strong|b|em|i|u|ul|ol|li|div)\b[^>]*>/i.test(String(s ?? ""));
}

const encje = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Zwykły tekst (stary opis) → HTML z akapitami. */
export function tekstNaHtml(t: string): string {
  return t
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => `<p>${encje(a).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Czyszczenie HTML do dozwolonych znaczników, bez żadnych atrybutów. */
export function oczyscHtml(html: string): string {
  let s = String(html ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed)\b[^>]*\/?>/gi, "");
  s = s.replace(/<\s*(\/?)\s*([a-z0-9]+)\b[^>]*>/gi, (_, zam: string, tag: string) => {
    let t = tag.toLowerCase();
    t = ZAMIANY[t] ?? t;
    if (!DOZWOLONE.has(t)) return t === "span" || t === "font" ? "" : " ";
    if (t === "br") return zam ? "" : "<br>";
    return `<${zam}${t}>`;
  });
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/<(strong|em|u|p|li)>\s*<\/\1>/g, "")
    .replace(/(<br>\s*){3,}/g, "<br><br>")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Opis do zapisu: z edytora (HTML) albo ze starego pola tekstowego. */
export function opisDoZapisu(wejscie: string): string {
  const s = String(wejscie ?? "").trim();
  if (!s) return "";
  return oczyscHtml(czyHtml(s) ? s : tekstNaHtml(s));
}

/** Opis jako zwykły tekst: strona www, AI, PDF-y, wyszukiwanie. */
export function opisNaTekst(s: string | null | undefined): string {
  const v = String(s ?? "");
  if (!czyHtml(v)) return v;
  return v
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(p|li|ul|ol|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Opis jako bezpieczny HTML do wyświetlenia (stary tekst zamieniamy na akapity). */
export function opisNaHtml(s: string | null | undefined): string {
  const v = String(s ?? "");
  return czyHtml(v) ? oczyscHtml(v) : tekstNaHtml(v);
}
