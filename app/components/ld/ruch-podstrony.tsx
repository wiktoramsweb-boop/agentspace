"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Ruch podstron marketingu. Strona główna ma własny silnik (silnik.tsx);
 * tutaj są efekty z prefiksem data-pd, żeby się nie gryzły:
 *  - data-pd="gora|lewo|prawo|skala|maska"  wejście elementu przy przewijaniu
 *  - data-pd-paralaksa="0.15"               przesunięcie w pionie względem środka ekranu
 *  - data-pd-licznik="1200"                 odliczanie liczby, gdy wejdzie w kadr
 *  - data-pd-rozwin                         sekcja przypięta, CSS dostaje --p od 0 do 1
 *  - data-pd-kroki                          przyklejony ekran, który zmienia się z tekstem
 * Bez JS i przy ograniczonym ruchu wszystko jest od razu widoczne i nieruchome.
 */
export function RuchPodstrony() {
  const sciezka = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SZEROKI = matchMedia("(min-width: 900px)").matches;
    const $$ = <T extends HTMLElement = HTMLElement>(s: string) => Array.from(document.querySelectorAll<T>(s));
    if (RM) {
      root.classList.remove("pd-js");
      $$("[data-pd-rozwin]").forEach((el) => el.style.setProperty("--p", "1"));
      return;
    }
    root.classList.add("pd-js");

    const liczba = (v: number) => Math.round(v).toLocaleString("pl-PL");
    const odlicz = (el: HTMLElement) => {
      if (el.dataset.pdLiczono) return;
      el.dataset.pdLiczono = "1";
      const cel = Number(el.dataset.pdLicznik);
      const start = performance.now();
      const krok = (t: number) => {
        const p = Math.min(1, (t - start) / 1400);
        el.textContent = liczba(cel * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(krok);
      };
      requestAnimationFrame(krok);
    };

    const obserwator = new IntersectionObserver(
      (wpisy) =>
        wpisy.forEach((w) => {
          if (!w.isIntersecting) return;
          const el = w.target as HTMLElement;
          el.classList.add("pd-widac");
          if (el.dataset.pdLicznik) odlicz(el);
          obserwator.unobserve(el);
        }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    $$("[data-pd], [data-pd-licznik]").forEach((el) => obserwator.observe(el));

    const paralaksy = $$("[data-pd-paralaksa]");
    const rozwiniecia = $$("[data-pd-rozwin]");
    const kroki = $$("[data-pd-kroki]");

    let vh = innerHeight;
    const mierz = () => {
      vh = innerHeight;
      rozwiniecia.forEach((el) => {
        el.style.height = SZEROKI ? `${Number(el.dataset.pdRozwin || 2.2) * vh}px` : "";
        if (!SZEROKI) el.style.setProperty("--p", "1");
      });
    };
    mierz();

    let raf = 0;
    const klatka = () => {
      raf = 0;
      for (const el of paralaksy) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const k = Number(el.dataset.pdParalaksa) || 0.15;
        el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * -k).toFixed(1)}px, 0)`;
      }
      if (SZEROKI) {
        for (const el of rozwiniecia) {
          const r = el.getBoundingClientRect();
          const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh) / 0.75));
          el.style.setProperty("--p", p.toFixed(3));
        }
      }
      for (const el of kroki) {
        const teksty = Array.from(el.querySelectorAll<HTMLElement>("[data-pd-krok]"));
        let aktywny = 0;
        let najblizej = Infinity;
        teksty.forEach((t, i) => {
          const r = t.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
          if (d < najblizej) {
            najblizej = d;
            aktywny = i;
          }
        });
        if (el.dataset.aktywny !== String(aktywny)) {
          el.dataset.aktywny = String(aktywny);
          teksty.forEach((t, i) => t.classList.toggle("on", i === aktywny));
          el.querySelectorAll<HTMLElement>("[data-pd-ekran]").forEach((s) => s.classList.toggle("on", s.dataset.pdEkran === String(aktywny)));
        }
      }
    };
    const zaplanuj = () => {
      if (!raf) raf = requestAnimationFrame(klatka);
    };
    klatka();
    addEventListener("scroll", zaplanuj, { passive: true });
    addEventListener("resize", mierz);

    return () => {
      obserwator.disconnect();
      removeEventListener("scroll", zaplanuj);
      removeEventListener("resize", mierz);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sciezka]);

  return null;
}
