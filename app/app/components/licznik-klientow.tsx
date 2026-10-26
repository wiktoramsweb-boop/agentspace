"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { licznikKlientow } from "../wiadomosci/actions";

/**
 * Plakietka nowych wiadomości od klientów z portalu. Klienci nie są
 * użytkownikami aplikacji, więc zamiast nasłuchu na żywo sprawdzamy co
 * pół minuty, przy powrocie do karty i przy każdej zmianie strony.
 */
export function LicznikKlientow() {
  const [ile, setIle] = useState(0);
  const sciezka = usePathname();
  const odswiez = useCallback(() => {
    licznikKlientow().then(setIle).catch(() => {});
  }, []);
  useEffect(() => {
    odswiez();
  }, [odswiez, sciezka]);
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && odswiez(), 30_000);
    document.addEventListener("visibilitychange", odswiez);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", odswiez);
    };
  }, [odswiez]);
  if (!ile) return null;
  return (
    <span className="ml-auto flex min-w-[20px] items-center justify-center rounded-full bg-sky-400 px-1.5 text-[11px] font-bold leading-5 text-[#04263a]">
      {ile > 99 ? "99+" : ile}
    </span>
  );
}
