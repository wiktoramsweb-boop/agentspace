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
    const { headers } = await import("next/headers");
    return (await headers()).get("x-demo") === "odczyt";
  } catch {
    // Poza zapytaniem HTTP (cron, skrypt, test) nie ma gościa.
    return false;
  }
}
