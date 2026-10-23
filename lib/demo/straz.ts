import type { AsyncLocalStorage } from "node:async_hooks";

// Blokada zapisu dla gościa wersji demo, egzekwowana w kliencie bazy (lib/supabase/admin.ts).
// Middleware oznacza zapytanie nagłówkiem x-demo: „odczyt” albo „zapis” (trening, asystent).
// Odczyty przechodzą zawsze, więc liczniki, wyszukiwarka i podglądy działają normalnie.

// Klasę bierzemy z globalThis (Next udostępnia ją na serwerze), a nie z importu
// node:async_hooks: klient bazy trafia pośrednio też do paczek przeglądarki
// (np. raport PDF), a tam moduł Node wywraca budowanie strony.
const Klasa = (globalThis as { AsyncLocalStorage?: typeof AsyncLocalStorage }).AsyncLocalStorage;
const pominiecie = Klasa ? new Klasa<true>() : null;

/** Kod wykonywany w imieniu systemu (np. odświeżenie danych biura demo), nie gościa. */
export function zPominieciemDemo<T>(fn: () => Promise<T>): Promise<T> {
  return pominiecie ? pominiecie.run(true, fn) : fn();
}

/** Czy bieżące zapytanie to gość demo, któremu nie wolno nic zmieniać. */
export async function gosciaBlokujemy(): Promise<boolean> {
  if (pominiecie?.getStore()) return false;
  try {
    const { headers, cookies } = await import("next/headers");
    const blokuj = (await headers()).get("x-demo") === "odczyt";
    if (blokuj) {
      // Znacznik dla przeglądarki: komunikat „w demo zapis jest wyłączony” ma
      // się pokazać tylko wtedy, gdy zapis naprawdę zatrzymaliśmy, a nie przy
      // każdej akcji serwera (część z nich tylko czyta).
      try {
        (await cookies()).set("as_demo_blok", String(Date.now()), { path: "/", maxAge: 30, sameSite: "lax" });
      } catch {
        // Podczas renderowania strony ciasteczek nie da się ustawić. Wtedy nic nie mówimy.
      }
    }
    return blokuj;
  } catch {
    // Poza zapytaniem HTTP (cron, skrypt, test) nie ma gościa.
    return false;
  }
}
