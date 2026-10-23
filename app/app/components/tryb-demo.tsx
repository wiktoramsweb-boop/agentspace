"use client";

import { useEffect } from "react";
import { useToast } from "./toast";
import { KOMUNIKAT_DEMO, demoMozeZapisac } from "@/lib/demo/tryb";

/**
 * Pasek wersji demo. Prawdziwa blokada zapisu siedzi w kliencie bazy
 * (lib/demo/straz.ts); tutaj tylko zatrzymujemy formularze wcześniej, żeby gość
 * zobaczył jasny komunikat zamiast ogólnego „nie udało się zapisać”.
 */
export function TrybDemo() {
  const toast = useToast();

  useEffect(() => {
    const zablokowane = (url: string, metoda: string) => {
      if (metoda.toUpperCase() === "GET" || metoda.toUpperCase() === "HEAD") return false;
      const u = new URL(url, location.href);
      return u.origin === location.origin && !demoMozeZapisac(u.pathname);
    };

    const naWysylke = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (form.method.toLowerCase() === "get" && !form.getAttribute("action")?.startsWith("javascript:")) return;
      if (!zablokowane(location.href, "POST")) return;
      e.preventDefault();
      e.stopPropagation();
      toast(KOMUNIKAT_DEMO, "info");
    };

    // Akcje serwera wywoływane z kodu (przyciski, przełączniki) nie przechodzą
    // przez submit. Blokadę i tak robi baza, tu tylko mówimy gościowi dlaczego.
    const oryginal = window.fetch;
    let ostatni = 0;
    window.fetch = (wejscie, opcje) => {
      const naglowki = new Headers(opcje?.headers ?? (wejscie instanceof Request ? wejscie.headers : undefined));
      const odpowiedz = oryginal(wejscie, opcje);
      if (!naglowki.has("next-action")) return odpowiedz;
      // Sprawdzamy po odpowiedzi, zanim dostanie ją komponent: jego „zapisano”
      // przyjdzie później i zdąży zostać wyciszone.
      return odpowiedz.then((r) => {
        const m = document.cookie.match(/(?:^|; )as_demo_blok=(\d+)/);
        if (m) {
          document.cookie = "as_demo_blok=; path=/; max-age=0";
          document.documentElement.dataset.demoBlokada = String(Date.now());
          if (Date.now() - ostatni > 3000) {
            ostatni = Date.now();
            toast(KOMUNIKAT_DEMO, "info");
          }
        }
        return r;
      });
    };

    window.addEventListener("submit", naWysylke, true);
    return () => {
      window.fetch = oryginal;
      window.removeEventListener("submit", naWysylke, true);
    };
  }, [toast]);

  return (
    <div className="mb-6 flex md:sticky md:top-2 md:z-30 flex-col gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-lg shadow-slate-900/20 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <b className="mr-2 rounded-md bg-emerald-400 px-1.5 py-0.5 text-xs font-bold text-slate-900">DEMO</b>
        Oglądasz przykładowe biuro. Trening AI Coach i asystent działają, zapisywanie zmian jest wyłączone.
      </p>
      <div className="flex flex-shrink-0 gap-2">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- zwykły link: Link pobierałby adres z wyprzedzeniem, a to wylogowuje */}
        <a href="/demo-wyjdz?dalej=signup" className="rounded-xl bg-emerald-400 px-3.5 py-2 text-sm font-bold text-slate-900 hover:bg-emerald-300">
          Załóż konto
        </a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- zwykły link: Link pobierałby adres z wyprzedzeniem, a to wylogowuje */}
        <a href="/demo-wyjdz" className="rounded-xl bg-white/10 px-3.5 py-2 text-sm font-medium hover:bg-white/20">
          Zakończ demo
        </a>
      </div>
    </div>
  );
}
