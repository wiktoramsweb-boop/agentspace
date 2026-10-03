import { createHmac, timingSafeEqual, scryptSync } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Logowanie do panelu operatora.
 *
 * Celowo NIE opiera się na kontach w aplikacji. Operator wchodzi tu z innego
 * powodu niż agent czy właściciel biura i bywa zalogowany na różne konta
 * Google w przeglądarce, więc wiązanie panelu z sesją aplikacji oznaczałoby
 * ciągłe przelogowywanie i jedną pomyłkę od wpuszczenia kogoś niewłaściwego.
 *
 * Dane logowania siedzą w zmiennych środowiskowych, nie w bazie: panel ma
 * działać także wtedy, gdy z bazą jest coś nie tak, bo to jest narzędzie do
 * diagnozowania awarii.
 *
 * Brak ustawionego hasła = panel zamknięty dla wszystkich. Odwrotna domyślna
 * wartość (brak hasła wpuszcza) byłaby dziurą czekającą na wdrożenie.
 */

const CIASTKO = "as_operator";
/** Osiem godzin: dzień pracy, po nim trzeba zalogować się jeszcze raz. */
const WAZNOSC_S = 8 * 60 * 60;

function login(): string | null {
  return process.env.OPERATOR_LOGIN?.trim() || null;
}

function haslo(): string | null {
  return process.env.OPERATOR_PASSWORD || null;
}

/** Czy panel jest w ogóle skonfigurowany. */
export function panelSkonfigurowany(): boolean {
  return Boolean(login() && haslo());
}

/**
 * Klucz podpisu wyprowadzamy z hasła.
 *
 * Dzięki temu zmiana hasła unieważnia wszystkie wydane ciasteczka i nie
 * trzeba pamiętać o osobnym sekrecie do podpisu.
 */
function kluczPodpisu(): Buffer {
  return scryptSync(`${login()}:${haslo()}`, "agentspace-operator", 32);
}

function podpisz(doKiedy: number): string {
  return createHmac("sha256", kluczPodpisu()).update(String(doKiedy)).digest("hex");
}

function rowne(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Czy podane dane logowania są poprawne. Porównanie odporne na pomiar czasu. */
export function danePoprawne(podanyLogin: string, podaneHaslo: string): boolean {
  const l = login();
  const h = haslo();
  if (!l || !h) return false;
  // Oba porównania wykonujemy zawsze, żeby czas odpowiedzi nie zdradzał,
  // które z pól było błędne.
  const okLogin = rowne(podanyLogin.trim().toLowerCase(), l.toLowerCase());
  const okHaslo = rowne(podaneHaslo, h);
  return okLogin && okHaslo;
}

/** Wartość ciasteczka sesji operatora. */
export function nowaSesja(): { wartosc: string; maxAge: number } {
  const doKiedy = Math.floor(Date.now() / 1000) + WAZNOSC_S;
  return { wartosc: `${doKiedy}.${podpisz(doKiedy)}`, maxAge: WAZNOSC_S };
}

/** Czy ciasteczko w żądaniu jest ważne i poprawnie podpisane. */
export async function sesjaWazna(): Promise<boolean> {
  if (!panelSkonfigurowany()) return false;

  const surowe = (await cookies()).get(CIASTKO)?.value;
  if (!surowe) return false;

  const [doKiedyTekst, podpis] = surowe.split(".");
  const doKiedy = Number(doKiedyTekst);
  if (!Number.isFinite(doKiedy) || !podpis) return false;
  if (doKiedy < Math.floor(Date.now() / 1000)) return false;

  return rowne(podpis, podpisz(doKiedy));
}

export const NAZWA_CIASTKA = CIASTKO;
