"use client";

import { useEffect, useId, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Nasłuch zmian w bazie na żywo, z zapasowym odświeżaniem.
 *
 * Supabase Realtime wysyła zdarzenie, gdy w tabeli pojawi się wiersz, który
 * zalogowana osoba ma prawo zobaczyć (polityki RLS z v49). Treści z tego
 * zdarzenia nie używamy: traktujemy je tylko jako sygnał „coś się zmieniło"
 * i dociągamy dane zwykłą akcją serwera, która sprawdza uprawnienia po swojemu.
 *
 * Gdy połączenie na żywo nie wstanie (sieć firmowa, brak publikacji Realtime
 * w projekcie), działa zwykłe odpytywanie co `zapasMs` i przy powrocie do karty.
 */
export function useNaZywo({
  kanal,
  tabela,
  filtr,
  onZmiana,
  zapasMs = 60_000,
  wlaczony = true,
}: {
  kanal: string;
  tabela: string;
  /** Filtr Realtime, np. `user_id=eq.<uuid>`. */
  filtr?: string;
  /** Dostaje treść zdarzenia z Realtime, gdy przyszło na żywo, albo nic przy odpytywaniu. */
  onZmiana: (zdarzenie?: { new?: Record<string, unknown>; old?: Record<string, unknown> }) => void;
  zapasMs?: number;
  wlaczony?: boolean;
}) {
  const cb = useRef(onZmiana);
  useEffect(() => {
    cb.current = onZmiana;
  }, [onZmiana]);
  // Klient Supabase w przeglądarce jest jeden na całą stronę i trzyma kanały
  // po nazwie. Ten sam komponent stoi czasem dwa razy (menu na telefonie
  // i na komputerze), a druga próba dopięcia nasłuchu do już otwartego kanału
  // rzuca wyjątkiem. Dlatego każda kopia dostaje własną nazwę.
  const instancja = useId();

  useEffect(() => {
    if (!wlaczony) return;
    const supabase = createSupabaseBrowserClient();
    // Podgląd na żywo jest dodatkiem. Jakikolwiek kłopot z połączeniem ma
    // zostawić zwykłe odświeżanie, a nie wywrócić stronę.
    let ch: ReturnType<typeof supabase.channel> | null = null;
    try {
      ch = supabase
        .channel(`${kanal}-${instancja}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: tabela, ...(filtr ? { filter: filtr } : {}) },
          (p) => cb.current(p as { new?: Record<string, unknown>; old?: Record<string, unknown> }),
        )
        .subscribe();
    } catch {
      ch = null;
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") cb.current();
    }, zapasMs);
    const naWidoku = () => {
      if (document.visibilityState === "visible") cb.current();
    };
    document.addEventListener("visibilitychange", naWidoku);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", naWidoku);
      if (ch) supabase.removeChannel(ch).catch(() => {});
    };
  }, [kanal, instancja, tabela, filtr, zapasMs, wlaczony]);
}

/** „2 min temu", „wczoraj 14:05", „12 paź". */
export function kiedy(iso: string): string {
  const d = new Date(iso);
  const roznica = (Date.now() - d.getTime()) / 1000;
  if (roznica < 45) return "przed chwilą";
  if (roznica < 3600) return `${Math.round(roznica / 60)} min temu`;
  const godz = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
  const dzis = new Date().toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" });
  const dzien = d.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" });
  if (dzien === dzis) return godz;
  const wczoraj = new Date(Date.now() - 86_400_000).toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw" });
  if (dzien === wczoraj) return `wczoraj ${godz}`;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" });
}
